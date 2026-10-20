import { useCallback, useEffect, useRef, useState } from "react";
import { hasAired, type Episode } from "@/domain/entities/Episode";
import type { SeasonMeta } from "@/domain/entities/Series";
import type { SeasonProgress } from "@/domain/entities/Progress";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useSeason } from "@/presentation/hooks/useDiscovery";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import { formatDate } from "@/presentation/utils/date";
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
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [detailEpisode, setDetailEpisode] = useState<Episode | null>(null);
  const { data, isLoading } = useSeason(tmdbId, open ? season.seasonNumber : null);
  const nextRef = useRef<HTMLDivElement | null>(null);
  const didScrollRef = useRef(false);

  const today = new Date().toISOString().slice(0, 10);
  const isUpcomingByMeta =
    (Boolean(season.airDate) && (season.airDate as string) > today) ||
    (!season.airDate && season.episodeCount === 0);
  const airedEpisodesInSeason = data ? data.episodes.filter((ep) => hasAired(ep)) : null;
  const isSeasonUpcoming =
    isUpcomingByMeta ||
    (airedEpisodesInSeason !== null && airedEpisodesInSeason.length === 0);

  const liveTotal = data
    ? airedEpisodesInSeason && airedEpisodesInSeason.length > 0
      ? airedEpisodesInSeason.length
      : data.episodes.length
    : null;
  const liveWatched = data
    ? data.episodes.filter((ep) => watchedIds.has(ep.tmdbEpisodeId)).length
    : null;

  const total = liveTotal ?? season.episodeCount;
  const watchedCount = Math.min(liveWatched ?? progress?.watchedEpisodes ?? 0, total);
  const percent = total > 0 ? Math.min(Math.round((watchedCount / total) * 1000) / 10, 100) : 0;
  const allWatched = !isSeasonUpcoming && total > 0 && watchedCount >= total;
  const upcomingDateLabel = formatDate(season.airDate);

  const nextUnwatched =
    data?.episodes.find((ep) => hasAired(ep) && !watchedIds.has(ep.tmdbEpisodeId)) ?? null;

  useEffect(() => {
    if (data && nextRef.current && !didScrollRef.current) {
      didScrollRef.current = true;
      nextRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data]);

  useEffect(() => {
    if (!open) didScrollRef.current = false;
  }, [open]);

  const setNextRef = useCallback((node: HTMLDivElement | null) => {
    nextRef.current = node;
  }, []);

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
            <span className="text-[1rem] font-semibold tracking-[-0.01em] text-white">
              {season.name}
            </span>
            {isSeasonUpcoming ? (
              <span className="shrink-0 rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-[#38bdf8]">
                {upcomingDateLabel ? `${t("upcoming")} · ${upcomingDateLabel}` : t("upcoming")}
              </span>
            ) : (
              <span className="shrink-0 text-[0.75rem] tabular-nums text-mist-500">
                {watchedCount}/{total}
              </span>
            )}
          </div>
          {!isSeasonUpcoming ? <ProgressBar value={percent} className="mt-2" /> : null}
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
              {(!isSeasonUpcoming && canTrack) || (nextUnwatched && !allWatched) ? (
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  {!isSeasonUpcoming && canTrack ? (
                    <button
                      type="button"
                      onClick={() =>
                        onToggleSeason(
                          season.seasonNumber,
                          !allWatched && airedEpisodesInSeason && airedEpisodesInSeason.length > 0
                            ? airedEpisodesInSeason
                            : data.episodes,
                          !allWatched
                        )
                      }
                      className="tap-none inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-850 px-3 py-1.5 text-[0.75rem] font-semibold text-white transition-colors hover:bg-ink-800 active:opacity-75"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`size-3.5 ${allWatched ? "text-mist-400" : "text-[#30d158]"}`}
                      >
                        <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{allWatched ? t("markSeasonUnwatched") : t("markSeasonWatched")}</span>
                    </button>
                  ) : null}

                  {nextUnwatched && !allWatched ? (
                    <button
                      type="button"
                      onClick={() =>
                        nextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                      }
                      className="tap-none inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-850 px-3 py-1.5 text-[0.75rem] font-semibold text-mist-300 transition-colors hover:bg-ink-800 hover:text-white active:opacity-75"
                    >
                      <span>
                        {t("jumpTo")} E{nextUnwatched.episodeNumber}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        className="size-3"
                      >
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              ) : null}

              {data.episodes.length === 0 ? (
                <p className="py-2 text-[0.8125rem] text-mist-500">{t("notAiredYet")}</p>
              ) : (
                <div className="divide-y divide-white/[0.08]">
                  {data.episodes.map((episode) => (
                    <div
                      key={episode.tmdbEpisodeId}
                      ref={
                        nextUnwatched?.tmdbEpisodeId === episode.tmdbEpisodeId
                          ? setNextRef
                          : undefined
                      }
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
              )}
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
