import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { SeriesStatus } from "@/domain/entities/SeriesStatus";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { SeriesPoster } from "./SeriesPoster";
import { StatusBadge } from "./StatusBadge";

export function WatchedBadge() {
  return (
    <span
      className="absolute right-2 bottom-2 flex size-6 items-center justify-center rounded-full bg-[#30d158] text-white shadow-sm shadow-black/50 ring-1 ring-white/20"
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
  want_to_watch: "bg-[#ff9f0a]",
  watched: "bg-[#30d158]",
  abandoned: "bg-danger-500",
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
      className={`absolute right-2 bottom-2 flex size-6 items-center justify-center rounded-full shadow-sm shadow-black/50 ring-1 ring-white/20 ${IN_LIBRARY_STYLES[status]}`}
      aria-label={`In your library: ${status.replace(/_/g, " ")}`}
    >
      {IN_LIBRARY_GLYPHS[status]}
    </span>
  );
}

export function RatingBadge({ value }: { value: number }) {
  return (
    <span className="ios-material absolute right-2 bottom-2 flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 shadow-sm shadow-black/50">
      <svg viewBox="0 0 24 24" className="size-3 text-star-500" fill="currentColor" aria-hidden="true">
        <path d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z" />
      </svg>
      <span className="text-[0.6875rem] font-semibold tabular-nums text-white">{value.toFixed(1)}</span>
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
    <Link to={`/series/${tmdbId}`} className="group tap-none block transition-opacity duration-150 active:opacity-75">
      <div className="relative">
        <SeriesPoster path={posterPath} alt={name} />
        {status ? (
          <StatusBadge status={status} className="absolute top-2 left-2 shadow-sm" />
        ) : null}
        {rating ? (
          <RatingBadge value={rating} />
        ) : status ? null : watched ? (
          <WatchedBadge />
        ) : libraryStatus ? (
          <InLibraryBadge status={libraryStatus} />
        ) : null}
      </div>
      <div className="mt-2 px-0.5">
        <p className="truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-white">{name}</p>
        {caption ? (
          <p className="mt-0.5 truncate text-[0.75rem] text-mist-500">{caption}</p>
        ) : year ? (
          <p className="mt-0.5 text-[0.75rem] text-mist-500">{year}</p>
        ) : null}
        {progressPercent !== undefined ? <ProgressBar value={progressPercent} className="mt-1.5" /> : null}
      </div>
    </Link>
  );
}
