import { env } from "@/core/config/env";
import { toUserMessage } from "@/core/errors/AppError";
import { usePushEnabled, useTogglePush } from "@/presentation/hooks/usePush";

type PushStatus = "ok" | "no-key" | "ios-install" | "unsupported";

function pushStatus(): PushStatus {
  if (typeof window === "undefined") {
    return "unsupported";
  }

  const hasApis =
    "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  if (!hasApis) {
    return isIOS && !standalone ? "ios-install" : "unsupported";
  }

  return env.vapidPublicKey ? "ok" : "no-key";
}

const REASONS: Record<Exclude<PushStatus, "ok">, string> = {
  "ios-install": "On iPhone, add Episodic to your Home Screen and open it from there to enable push.",
  "no-key": "Push isn’t configured for this build (missing VAPID key).",
  unsupported: "This browser doesn’t support push notifications.",
};

export function PushToggle() {
  const status = pushStatus();
  const { data: enabled } = usePushEnabled();
  const toggle = useTogglePush();

  const on = status === "ok" && (enabled ?? false);
  const denied =
    status === "ok" && typeof Notification !== "undefined" && Notification.permission === "denied";
  const disabled = status !== "ok" || toggle.isPending || denied;

  return (
    <div className="rounded-card bg-ink-850 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-mist-100">Push notifications</p>
          <p className="mt-0.5 text-[12px] text-mist-500">
            New followers and reviews from people you follow.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Push notifications"
          disabled={disabled}
          onClick={() => toggle.mutate(!on)}
          className={`tap-none inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0 transition-colors disabled:opacity-40 ${
            on ? "bg-accent-600" : "bg-ink-700"
          }`}
        >
          <span
            className={`size-5 rounded-full bg-white transition-transform ${
              on ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {status !== "ok" ? (
        <p className="mt-2 text-[12px] text-mist-500">{REASONS[status]}</p>
      ) : null}
      {denied ? (
        <p className="mt-2 text-[12px] text-mist-500">
          Notifications are blocked in your browser settings for this site.
        </p>
      ) : null}
      {toggle.isError ? (
        <p role="alert" className="mt-2 text-[12px] text-danger-500">
          {toUserMessage(toggle.error)}
        </p>
      ) : null}
    </div>
  );
}
