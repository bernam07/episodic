import { useState } from "react";
import type { Episode } from "@/domain/entities/Episode";
import type { SeasonMeta } from "@/domain/entities/Series";
import type { SeasonProgress } from "@/domain/entities/Progress";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useSeason } from "@/presentation/hooks/useDiscovery";
import { EpisodeRow } from "./EpisodeRow";

type SeasonAccordionProps = {
  tmdbId: number;
  season: SeasonMeta;
  progress?: SeasonProgress;
  watchedIds: Set<number>;
  canTrack: boolean;
  onToggleEpisode: (episode: Episode, watched: boolean) => void;
  onToggleSeason: (seasonNumber: number, episodes: Episode[], watched: boolean) => void;
};

export function SeasonAccordion({
  tmdbId,
  season,
  progress,
  watchedIds,
  canTrack,
  onToggleEpisode,
  onToggleSeason,
}: SeasonAccordionProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useSeason(tmdbId, open ? season.seasonNumber : null);

  const watchedCount = progress?.watchedEpisodes ?? 0;
  const percent = progress?.progressPercent ?? 0;
  const allWatched = season.episodeCount > 0 && watchedCount >= season.episodeCount;

  return (
    <div className="border-b border-ink-800 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="tap-none flex w-full items-center gap-3 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-semibold text-mist-100">{season.name}</span>
            <span className="shrink-0 text-[11px] tabular-nums text-mist-500">
              {watchedCount}/{season.episodeCount}
            </span>
          </div>
          <ProgressBar value={percent} className="mt-2" />
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`size-4 shrink-0 text-mist-500 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className="pb-3">
          {isLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Spinner />
            </div>
          ) : null}

          {data ? (
            <>
              {canTrack ? (
                <button
                  type="button"
                  onClick={() => onToggleSeason(season.seasonNumber, data.episodes, !allWatched)}
                  className="tap-none mb-1 min-h-[36px] rounded-lg px-2 text-[13px] font-semibold text-accent-400 active:bg-ink-800"
                >
                  {allWatched ? "Mark season unwatched" : "Mark season watched"}
                </button>
              ) : null}

              <div className="divide-y divide-ink-800/60">
                {data.episodes.map((episode) => (
                  <EpisodeRow
                    key={episode.tmdbEpisodeId}
                    episode={episode}
                    watched={watchedIds.has(episode.tmdbEpisodeId)}
                    disabled={!canTrack}
                    onToggle={(watched) => onToggleEpisode(episode, watched)}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
