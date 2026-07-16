import { hasAired, type Episode } from "@/domain/entities/Episode";
import { stillUrl } from "@/data/tmdb/images";

type EpisodeRowProps = {
  episode: Episode;
  watched: boolean;
  onToggle: (watched: boolean) => void;
  disabled?: boolean;
};

export function EpisodeRow({ episode, watched, onToggle, disabled = false }: EpisodeRowProps) {
  const aired = hasAired(episode);
  const still = stillUrl(episode.stillPath);

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="relative h-[52px] w-[92px] shrink-0 overflow-hidden rounded-lg bg-ink-800">
        {still ? (
          <img
            src={still}
            alt=""
            loading="lazy"
            decoding="async"
            className={`size-full object-cover ${watched ? "" : "opacity-60"}`}
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-[14px] font-medium ${watched ? "text-mist-100" : "text-mist-300"}`}>
          {episode.episodeNumber}. {episode.name}
        </p>
        <p className="mt-0.5 text-[11px] text-mist-500">
          {aired ? episode.airDate : "Not aired yet"}
          {episode.runtime ? ` · ${episode.runtime} min` : ""}
        </p>
      </div>

      <button
        type="button"
        disabled={disabled || !aired}
        aria-pressed={watched}
        aria-label={watched ? `Mark episode ${episode.episodeNumber} unwatched` : `Mark episode ${episode.episodeNumber} watched`}
        onClick={() => onToggle(!watched)}
        className="tap-none flex size-11 shrink-0 items-center justify-center disabled:opacity-30"
      >
        <span
          className={`flex size-[26px] items-center justify-center rounded-full border-2 transition-colors ${
            watched ? "border-accent-500 bg-accent-500 text-white" : "border-ink-600 text-transparent"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3.5">
            <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </div>
  );
}
