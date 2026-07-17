import { hasAired, type Episode } from "@/domain/entities/Episode";
import { stillUrl } from "@/data/tmdb/images";
import { Button } from "@/presentation/components/ui/Button";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { formatDate } from "@/presentation/utils/date";

type EpisodeDetailSheetProps = {
  episode: Episode | null;
  watched: boolean;
  canTrack: boolean;
  onToggle: (watched: boolean) => void;
  onClose: () => void;
};

export function EpisodeDetailSheet({ episode, watched, canTrack, onToggle, onClose }: EpisodeDetailSheetProps) {
  const aired = episode ? hasAired(episode) : false;
  const still = episode ? stillUrl(episode.stillPath, "w300") : null;
  const airDate = episode ? formatDate(episode.airDate) : null;

  return (
    <Sheet
      open={episode !== null}
      onClose={onClose}
      title={episode ? `Season ${episode.seasonNumber}, Episode ${episode.episodeNumber}` : ""}
    >
      {episode ? (
        <>
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-ink-800">
            {still ? <img src={still} alt="" className="size-full object-cover" /> : null}
          </div>

          <h3 className="mt-4 text-[17px] font-bold text-mist-100">{episode.name}</h3>

          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12px] text-mist-500">
            <span>{aired ? (airDate ?? episode.airDate) : "Not aired yet"}</span>
            {episode.runtime ? <span>· {episode.runtime} min</span> : null}
            {episode.voteAverage ? (
              <span className="flex items-center gap-1 text-star-500">
                ·
                <svg viewBox="0 0 24 24" className="size-3" aria-hidden="true">
                  <path
                    d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3-1.1-6.5L.4 9.3l6.5-.9L12 2.5z"
                    fill="currentColor"
                  />
                </svg>
                {episode.voteAverage.toFixed(1)}
              </span>
            ) : null}
          </p>

          <p className="mt-3 text-[14px] leading-relaxed text-mist-300">
            {episode.overview || "No description available."}
          </p>

          {canTrack && aired ? (
            <Button
              fullWidth
              variant={watched ? "secondary" : "primary"}
              className="mt-5"
              onClick={() => onToggle(!watched)}
            >
              {watched ? "Mark Unwatched" : "Mark Watched"}
            </Button>
          ) : null}
        </>
      ) : null}
    </Sheet>
  );
}
