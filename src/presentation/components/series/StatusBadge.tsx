import { SERIES_STATUS_LABELS, type SeriesStatus } from "@/domain/entities/SeriesStatus";

const TONES: Record<SeriesStatus, string> = {
  want_to_watch: "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.12)]",
  watching: "bg-accent-500/15 text-accent-300 border border-accent-500/30 shadow-[0_0_10px_rgba(99,102,241,0.15)]",
  watched: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.12)]",
  abandoned: "bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.12)]",
};

const DOTS: Record<SeriesStatus, string> = {
  want_to_watch: "bg-amber-400",
  watching: "bg-accent-400",
  watched: "bg-emerald-400",
  abandoned: "bg-rose-400",
};

type StatusBadgeProps = {
  status: SeriesStatus;
  className?: string;
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap backdrop-blur-md ${TONES[status]} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${DOTS[status]}`} />
      {SERIES_STATUS_LABELS[status]}
    </span>
  );
}
