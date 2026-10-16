import type { ReactNode } from "react";
import { SERIES_STATUS_LABELS, SERIES_STATUSES, type SeriesStatus } from "@/domain/entities/SeriesStatus";

type StatusPickerProps = {
  value: SeriesStatus | null;
  onChange: (status: SeriesStatus) => void;
  onRemove?: () => void;
  pending?: boolean;
  pendingStatus?: SeriesStatus | null;
  airedEpisodes?: number;
  watchedEpisodes?: number;
};

const DESCRIPTIONS: Record<SeriesStatus, string> = {
  want_to_watch: "Save it for later",
  watching: "Track episodes as you go",
  watched: "Marks every aired episode as seen",
  abandoned: "Stopped watching, keeps your progress",
};

const ICONS: Record<SeriesStatus, ReactNode> = {
  want_to_watch: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]">
      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" strokeLinejoin="round" />
    </svg>
  ),
  watching: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]">
      <path d="M8 5.5v13l11-6.5-11-6.5z" strokeLinejoin="round" />
    </svg>
  ),
  watched: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  abandoned: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" />
    </svg>
  ),
};

export function StatusPicker({
  value,
  onChange,
  onRemove,
  pending = false,
  pendingStatus = null,
  airedEpisodes,
  watchedEpisodes = 0,
}: StatusPickerProps) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      {SERIES_STATUSES.map((status) => {
        const active = value === status;
        const busy = pending && pendingStatus === status;

        const resetsProgress = status === "want_to_watch" && watchedEpisodes > 0;
        const description = resetsProgress
          ? `Resets your ${watchedEpisodes} watched ${watchedEpisodes === 1 ? "episode" : "episodes"}`
          : status === "watched" && airedEpisodes !== undefined && airedEpisodes > 0
            ? `Marks all ${airedEpisodes} aired episodes as seen`
            : DESCRIPTIONS[status];

        return (
          <button
            key={status}
            type="button"
            disabled={pending}
            onClick={() => onChange(status)}
            className={`tap-none flex min-h-[60px] items-center gap-3.5 rounded-[14px] border px-4 text-left transition-colors disabled:opacity-60 ${
              active
                ? "border-accent-500/40 bg-accent-500/15"
                : "border-white/[0.07] bg-ink-850 active:bg-ink-800"
            }`}
          >
            <span className={active ? "text-accent-500" : "text-mist-400"}>{ICONS[status]}</span>

            <span className="min-w-0 flex-1">
              <span className={`block text-[0.9375rem] font-semibold ${active ? "text-accent-400" : "text-white"}`}>
                {SERIES_STATUS_LABELS[status]}
              </span>
              <span
                className={`mt-0.5 block truncate text-[0.75rem] ${resetsProgress ? "text-star-500" : "text-mist-500"}`}
              >
                {description}
              </span>
            </span>

            {busy ? (
              <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
            ) : active ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="size-5 shrink-0 text-accent-500"
              >
                <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </button>
        );
      })}

      {value && onRemove ? (
        <button
          type="button"
          disabled={pending}
          onClick={onRemove}
          className="tap-none mt-1 min-h-[48px] rounded-[14px] text-[0.9375rem] font-normal text-danger-500 active:opacity-70 disabled:opacity-50"
        >
          Remove from library
        </button>
      ) : null}
    </div>
  );
}
