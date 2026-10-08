import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { SeriesStatus } from "@/domain/entities/SeriesStatus";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { SeriesPoster } from "./SeriesPoster";
import { StatusBadge } from "./StatusBadge";

export function WatchedBadge() {
  return (
    <span
      className="absolute right-2 bottom-2 flex size-6 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-md shadow-black/40 ring-1 ring-white/25 backdrop-blur-md"
      aria-label="Watched"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="size-3.5">
        <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

const IN_LIBRARY_STYLES: Record<SeriesStatus, string> = {
  watching: "bg-accent-500",
  want_to_watch: "bg-amber-500",
  watched: "bg-emerald-500",
  abandoned: "bg-rose-500",
};

const IN_LIBRARY_GLYPHS: Record<SeriesStatus, ReactNode> = {
  watching: (
    <svg viewBox="0 0 24 24" fill="white" className="size-2.5">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  want_to_watch: (
    <svg viewBox="0 0 24 24" fill="white" className="size-2.5">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  ),
  watched: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" className="size-2.5">
      <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  abandoned: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" className="size-2.5">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  ),
};

export function InLibraryBadge({ status }: { status: SeriesStatus }) {
  return (
    <span
      className={`absolute right-2 bottom-2 flex size-6 items-center justify-center rounded-full shadow-md shadow-black/40 ring-1 ring-white/20 ${IN_LIBRARY_STYLES[status]}`}
      aria-label={`In your library: ${status.replace(/_/g, " ")}`}
    >
      {IN_LIBRARY_GLYPHS[status]}
    </span>
  );
}

export function RatingBadge({ value }: { value: number }) {
  const gradientId = useId();
  return (
    <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full border border-white/15 bg-black/75 px-2 py-0.5 shadow-md shadow-black/50 backdrop-blur-md">
      <svg viewBox="0 0 24 24" className="size-3" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <path
          d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z"
          fill={`url(#${gradientId})`}
        />
      </svg>
      <span className="text-[11px] font-bold tabular-nums text-white">{value.toFixed(1)}</span>
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
  libraryStatus?: SeriesStatus | null;
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
  libraryStatus,
}: SeriesCardProps) {
  return (
    <Link to={`/series/${tmdbId}`} className="group tap-none block transition-transform duration-200 active:scale-[0.97]">
      <div className="relative">
        <SeriesPoster path={posterPath} alt={name} />
        {status ? (
          <StatusBadge status={status} className="absolute top-2 left-2 shadow-lg" />
        ) : null}
        {rating ? (
          <RatingBadge value={rating} />
        ) : status ? null : watched ? (
          <WatchedBadge />
        ) : libraryStatus ? (
          <InLibraryBadge status={libraryStatus} />
        ) : null}
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="truncate text-[13px] font-semibold text-mist-100 transition-colors group-hover:text-white">{name}</p>
        {caption ? (
          <p className="mt-0.5 truncate text-[11px] text-mist-400">{caption}</p>
        ) : year ? (
          <p className="mt-0.5 text-[11px] font-medium text-mist-500">{year}</p>
        ) : null}
        {progressPercent !== undefined ? <ProgressBar value={progressPercent} className="mt-1.5" /> : null}
      </div>
    </Link>
  );
}
