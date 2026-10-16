import { useCallback, useEffect, useRef, useState } from "react";
import { hasAired, type Episode } from "@/domain/entities/Episode";
import type { SeasonMeta } from "@/domain/entities/Series";
import type { SeasonProgress } from "@/domain/entities/Progress";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useSeason } from "@/presentation/hooks/useDiscovery";
import { EpisodeDetailSheet } from "./EpisodeDetailSheet";
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
  const [detailEpisode, setDetailEpisode] = useState<Episode | null>(null);
  const { data, isLoading } = useSeason(tmdbId, open ? season.seasonNumber : null);
  const nextRef = useRef<HTMLDivElement | null>(null);
  const didScrollRef = useRef(false);

  const liveTotal = data ? data.episodes.length : null;
  const liveWatched = data
    ? data.episodes.filter((ep) => watchedIds.has(ep.tmdbEpisodeId)).length
    : null;

  const total = liveTotal ?? season.episodeCount;
  const watchedCount = Math.min(liveWatched ?? progress?.watchedEpisodes ?? 0, total);
  const percent = total > 0 ? Math.min(Math.round((watchedCount / total) * 1000) / 10, 100) : 0;
  const allWatched = total > 0 && watchedCount >= total;

  const nextUnwatched = data?.episodes.find(
    (ep) => hasAired(ep) && !watchedIds.has(ep.tmdbEpisodeId)
  ) ?? null;

  useEffect(() => {
    if (data && nextRef.current && !didScrollRef.current) {
      didScrollRef.current = true;
      nextRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data]);

  useEffect(() => {
    if (!open) didScrollRef.current = false;
  }, [open]);

  const setNextRef = useCallback(
    (node: HTMLDivElement | null) => {
      nextRef.current = node;
    },
    []
  );

  return (
    <div className="border-b border-white/[0.08] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="tap-none flex w-full items-center gap-3 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[1rem] font-semibold tracking-[-0.01em] text-white">{season.name}</span>
            <span className="shrink-0 text-[0.75rem] tabular-nums text-mist-500">
              {watchedCount}/{total}
            </span>
          </div>
          <ProgressBar value={percent} className="mt-2" />
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
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
                  className="tap-none mb-1 min-h-[36px] rounded-[8px] px-2 text-[0.875rem] font-normal text-accent-500 active:opacity-70"
                >
                  {allWatched ? "Mark season unwatched" : "Mark season watched"}
                </button>
              ) : null}

              {nextUnwatched && !allWatched ? (
                <button
                  type="button"
                  onClick={() => nextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="tap-none mb-1 ml-2 min-h-[36px] rounded-[8px] px-2 text-[0.875rem] font-normal text-mist-300 active:opacity-70"
                >
                  Jump to E{nextUnwatched.episodeNumber}
                </button>
              ) : null}

              <div className="divide-y divide-white/[0.08]">
                {data.episodes.map((episode) => (
                  <div
                    key={episode.tmdbEpisodeId}
                    ref={nextUnwatched?.tmdbEpisodeId === episode.tmdbEpisodeId ? setNextRef : undefined}
                  >
                    <EpisodeRow
                      episode={episode}
                      watched={watchedIds.has(episode.tmdbEpisodeId)}
                      disabled={!canTrack}
                      onToggle={(watched) => onToggleEpisode(episode, watched)}
                      onOpenDetail={() => setDetailEpisode(episode)}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <EpisodeDetailSheet
        episode={detailEpisode}
        watched={detailEpisode ? watchedIds.has(detailEpisode.tmdbEpisodeId) : false}
        canTrack={canTrack}
        onToggle={(watched) => {
          if (detailEpisode) {
            onToggleEpisode(detailEpisode, watched);
          }
        }}
        onClose={() => setDetailEpisode(null)}
      />
    </div>
  );
}
