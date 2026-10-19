import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { SeriesStatus } from "@/domain/entities/SeriesStatus";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { SeriesPoster } from "./SeriesPoster";
import { StatusBadge } from "./StatusBadge";

export function WatchedBadge() {
  return (
    <span
      className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-[7px] border border-white/20 bg-black/65 text-[#30d158] backdrop-blur-md"
      aria-label="Watched"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3.5">
        <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

const IN_LIBRARY_STYLES: Record<SeriesStatus, string> = {
  watching: "text-accent-400",
  want_to_watch: "text-star-500",
  watched: "text-[#30d158]",
  abandoned: "text-danger-500",
};

const IN_LIBRARY_GLYPHS: Record<SeriesStatus, ReactNode> = {
  watching: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  want_to_watch: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
  watched: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3.5">
      <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  abandoned: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  ),
};

export function InLibraryBadge({ status }: { status: SeriesStatus }) {
  return (
    <span
      className={`absolute top-2 left-2 flex size-6 items-center justify-center rounded-[7px] border border-white/20 bg-black/65 backdrop-blur-md ${IN_LIBRARY_STYLES[status]}`}
      aria-label={`In your library: ${status.replace(/_/g, " ")}`}
    >
      {IN_LIBRARY_GLYPHS[status]}
    </span>
  );
}

export function RatingBadge({ value }: { value: number }) {
  return (
    <span className="ios-material absolute right-2 bottom-2 flex items-center gap-1 rounded-[6px] border border-white/15 px-1.5 py-0.5 shadow-sm shadow-black/50">
      <svg viewBox="0 0 24 24" className="size-3 text-star-500" fill="currentColor" aria-hidden="true">
        <path d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z" />
      </svg>
      <span className="text-[0.6875rem] font-bold tabular-nums text-white">{value.toFixed(1)}</span>
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
  tmdbStatus?: string | null;
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
  tmdbStatus,
  rating,
  watched,
  libraryStatus,
}: SeriesCardProps) {
  return (
    <Link to={`/series/${tmdbId}`} className="group tap-none block transition-opacity duration-150 active:opacity-75">
      <div className="relative">
        <SeriesPoster path={posterPath} alt={name} />
        {status ? (
          <StatusBadge status={status} tmdbStatus={tmdbStatus} className="absolute top-2 left-2 shadow-sm" />
        ) : watched ? (
          <WatchedBadge />
        ) : libraryStatus ? (
          <InLibraryBadge status={libraryStatus} />
        ) : null}
      </div>
      <div className="mt-2 px-0.5">
        {rating ? (
          <div className="mb-0.5 flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="size-3 text-star-500" fill="currentColor" aria-hidden="true">
              <path d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z" />
            </svg>
            <span className="text-[0.75rem] font-bold tabular-nums text-white">{rating.toFixed(1)}</span>
          </div>
        ) : null}
        <p className="truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-white">
          {name}
          {year && !caption ? <span className="font-normal text-mist-400"> ({year})</span> : null}
        </p>
        {caption ? (
          <p className="mt-0.5 truncate text-[0.75rem] text-mist-500">{caption}</p>
        ) : null}
        {progressPercent !== undefined ? <ProgressBar value={progressPercent} className="mt-1.5" /> : null}
      </div>
    </Link>
  );
}
