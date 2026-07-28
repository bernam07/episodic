import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:notifications@episodic.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type PushPayload = { title: string; body: string; url: string; tag: string };

type SubscriptionRow = { id: string; endpoint: string; p256dh: string; auth: string };

const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function displayName(userId: string): Promise<{ name: string; username: string }> {
  const { data } = await service
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .maybeSingle();

  return { name: data?.display_name || data?.username || "Someone", username: data?.username ?? "" };
}

async function sendTo(userIds: string[], payload: PushPayload): Promise<number> {
  if (userIds.length === 0) {
    return 0;
  }

  const { data: subs } = await service
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  let sent = 0;

  await Promise.all(
    (subs ?? []).map(async (sub: SubscriptionRow) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await service.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );

  return sent;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return json({ error: "missing authorization" }, 401);
  }

  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
  } = await authed.auth.getUser();

  if (!user) {
    return json({ error: "invalid token" }, 401);
  }

  let body: { type?: string; followingId?: string; seriesId?: string };

  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid body" }, 400);
  }

  const actor = await displayName(user.id);

  if (body.type === "follow" && body.followingId) {
    if (body.followingId === user.id) {
      return json({ sent: 0 });
    }

    const sent = await sendTo([body.followingId], {
      title: `${actor.name} started following you`,
      body: "Tap to see their profile.",
      url: `/user/${actor.username}`,
      tag: `follow:${user.id}`,
    });

    return json({ sent });
  }

  if (body.type === "review" && body.seriesId) {
    const { data: followers } = await service
      .from("follows")
      .select("follower_id")
      .eq("following_id", user.id);

    const recipients = (followers ?? [])
      .map((row: { follower_id: string }) => row.follower_id)
      .filter((id: string) => id !== user.id);

    const { data: series } = await service
      .from("series")
      .select("tmdb_id, name")
      .eq("id", body.seriesId)
      .maybeSingle();

    const sent = await sendTo(recipients, {
      title: `${actor.name} reviewed ${series?.name ?? "a series"}`,
      body: "Tap to read the review.",
      url: series?.tmdb_id ? `/series/${series.tmdb_id}` : "/friends",
      tag: `review:${user.id}:${body.seriesId}`,
    });

    return json({ sent });
  }

  return json({ error: "unknown type" }, 400);
});
