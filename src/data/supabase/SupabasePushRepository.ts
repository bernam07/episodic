import { env } from "@/core/config/env";
import { AppError } from "@/core/errors/AppError";
import type { IPushRepository } from "@/domain/repositories/IPushRepository";
import { supabase } from "./client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    throw new AppError("auth", "You need to be signed in.");
  }

  return data.session.user.id;
}

async function existingSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

export class SupabasePushRepository implements IPushRepository {
  async isEnabled(): Promise<boolean> {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return false;
    }
    return (await existingSubscription()) !== null;
  }

  async enable(): Promise<boolean> {
    if (!env.vapidPublicKey) {
      throw new AppError("validation", "Push notifications are not configured.");
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(env.vapidPublicKey) as BufferSource,
      }));

    const payload = subscription.toJSON();
    const keys = payload.keys ?? {};
    const userId = await currentUserId();

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh ?? "",
        auth: keys.auth ?? "",
        user_agent: navigator.userAgent,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return true;
  }

  async disable(): Promise<void> {
    const subscription = await existingSubscription();

    if (!subscription) {
      return;
    }

    const { endpoint } = subscription;
    await subscription.unsubscribe();

    const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }

  async notifyFollow(followingId: string): Promise<void> {
    await supabase.functions.invoke("push", { body: { type: "follow", followingId } });
  }

  async notifyReview(seriesId: string): Promise<void> {
    await supabase.functions.invoke("push", { body: { type: "review", seriesId } });
  }
}
