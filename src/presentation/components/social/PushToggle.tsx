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
    <div className="rounded-[14px] border border-white/[0.07] bg-ink-850 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-semibold text-white">Push notifications</p>
          <p className="mt-0.5 text-[0.8125rem] text-mist-500">
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
          className={`tap-none relative h-[31px] w-[51px] shrink-0 rounded-full p-[2px] transition-colors disabled:opacity-40 ${
            on ? "bg-[#30d158]" : "bg-ink-700"
          }`}
        >
          <span
            className={`block size-[27px] rounded-full bg-white shadow-sm transition-transform ${
              on ? "translate-x-[20px]" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {status !== "ok" ? (
        <p className="mt-2 text-[0.75rem] text-mist-500">{REASONS[status]}</p>
      ) : null}
      {denied ? (
        <p className="mt-2 text-[0.75rem] text-mist-500">
          Notifications are blocked in your browser settings for this site.
        </p>
      ) : null}
      {toggle.isError ? (
        <p role="alert" className="mt-2 text-[0.75rem] text-danger-500">
          {toUserMessage(toggle.error)}
        </p>
      ) : null}
    </div>
  );
}
