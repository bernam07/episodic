import { useId } from "react";
import { Link } from "react-router-dom";
import type { SeriesStatus } from "@/domain/entities/SeriesStatus";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { SeriesPoster } from "./SeriesPoster";
import { StatusBadge } from "./StatusBadge";

export function WatchedBadge() {
  return (
    <span
      className="absolute right-1.5 bottom-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-500/90 backdrop-blur-sm"
      aria-label="Watched"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" className="size-3">
        <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function RatingBadge({ value }: { value: number }) {
  const gradientId = useId();
  return (
    <span className="absolute right-1.5 bottom-1.5 flex items-center gap-0.5 rounded-full bg-ink-950/80 px-1.5 py-0.5 backdrop-blur-sm">
      <svg viewBox="0 0 24 24" className="size-2.5" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <path
          d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z"
          fill={`url(#${gradientId})`}
        />
      </svg>
      <span className="text-[10px] font-bold tabular-nums text-mist-100">{value.toFixed(1)}</span>
    </span>
  );
}

type SeriesCardProps = {
  tmdbId: number;
  name: string;
  posterPath: string | null;
  year?: string | null;
  progressPercent?: number;
  caption?: string;
  status?: SeriesStatus;
  rating?: number | null;
  watched?: boolean;
};

export function SeriesCard({
  tmdbId,
  name,
  posterPath,
  year,
  progressPercent,
  caption,
  status,
  rating,
  watched,
}: SeriesCardProps) {
  return (
    <Link to={`/series/${tmdbId}`} className="tap-none block active:opacity-70">
      <div className="relative">
        <SeriesPoster path={posterPath} alt={name} />
        {status ? (
          <StatusBadge status={status} className="absolute top-1.5 left-1.5 backdrop-blur-sm" />
        ) : null}
        {rating ? <RatingBadge value={rating} /> : watched && !status ? <WatchedBadge /> : null}
      </div>
      <div className="mt-2 px-0.5">
        <p className="truncate text-[13px] font-semibold text-mist-100">{name}</p>
        {caption ? (
          <p className="mt-0.5 truncate text-[11px] text-mist-400">{caption}</p>
        ) : year ? (
          <p className="mt-0.5 text-[11px] text-mist-500">{year}</p>
        ) : null}
        {progressPercent !== undefined ? <ProgressBar value={progressPercent} className="mt-1.5" /> : null}
      </div>
    </Link>
  );
}
