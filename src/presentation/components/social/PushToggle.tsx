import { toUserMessage } from "@/core/errors/AppError";
import { pushSupported, usePushEnabled, useTogglePush } from "@/presentation/hooks/usePush";

export function PushToggle() {
  const { data: enabled } = usePushEnabled();
  const toggle = useTogglePush();

  if (!pushSupported()) {
    return null;
  }

  const on = enabled ?? false;
  const denied = typeof Notification !== "undefined" && Notification.permission === "denied";

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
          disabled={toggle.isPending || denied}
          onClick={() => toggle.mutate(!on)}
          className={`tap-none relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            on ? "bg-accent-600" : "bg-ink-700"
          }`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
              on ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

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
