import { Link } from "react-router-dom";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { SeriesPoster } from "./SeriesPoster";

type SeriesCardProps = {
  tmdbId: number;
  name: string;
  posterPath: string | null;
  year?: string | null;
  progressPercent?: number;
  caption?: string;
};

export function SeriesCard({
  tmdbId,
  name,
  posterPath,
  year,
  progressPercent,
  caption,
}: SeriesCardProps) {
  return (
    <Link to={`/series/${tmdbId}`} className="tap-none group block active:opacity-70">
      <SeriesPoster path={posterPath} alt={name} />
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
