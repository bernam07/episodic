import { SERIES_STATUS_LABELS, type SeriesStatus } from "@/domain/entities/SeriesStatus";

const TONES: Record<SeriesStatus, string> = {
  want_to_watch: "bg-ink-700/90 text-mist-300",
  watching: "bg-accent-600/90 text-white",
  watched: "bg-emerald-600/90 text-white",
  abandoned: "bg-ink-600/90 text-mist-400",
};

type StatusBadgeProps = {
  status: SeriesStatus;
  className?: string;
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap ${TONES[status]} ${className}`}
    >
      {SERIES_STATUS_LABELS[status]}
    </span>
  );
}
