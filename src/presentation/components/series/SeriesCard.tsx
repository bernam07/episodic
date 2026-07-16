import { Link } from "react-router-dom";
import type { SeriesStatus } from "@/domain/entities/SeriesStatus";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { SeriesPoster } from "./SeriesPoster";
import { StatusBadge } from "./StatusBadge";

type SeriesCardProps = {
  tmdbId: number;
  name: string;
  posterPath: string | null;
  year?: string | null;
  progressPercent?: number;
  caption?: string;
  status?: SeriesStatus;
};

export function SeriesCard({
  tmdbId,
  name,
  posterPath,
  year,
  progressPercent,
  caption,
  status,
}: SeriesCardProps) {
  return (
    <Link to={`/series/${tmdbId}`} className="tap-none block active:opacity-70">
      <div className="relative">
        <SeriesPoster path={posterPath} alt={name} />
        {status ? (
          <StatusBadge status={status} className="absolute top-1.5 left-1.5 backdrop-blur-sm" />
        ) : null}
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
