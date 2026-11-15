import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { backdropUrl } from "@/data/tmdb/images";
import { computeLibraryInsights, type GenreCount } from "@/domain/entities/LibraryInsights";
import type { RatingSummary } from "@/domain/entities/RatingSummary";
import {
  DISPLAY_SERIES_STATUSES,
  type DisplaySeriesStatus,
} from "@/domain/entities/SeriesStatus";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { StatsShareSheet } from "@/presentation/components/stats/StatsShareSheet";
import {
  Duration,
  InlineStat,
  SectionHeading,
} from "@/presentation/components/stats/StatsPrimitives";
import { Skeleton } from "@/presentation/components/ui/Skeleton";
import { useLibrary, useWatchStreak } from "@/presentation/hooks/useTracking";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import { plural } from "@/presentation/utils/plural";

const STATUS_COLORS: Record<DisplaySeriesStatus, string> = {
  watching: "bg-accent-500",
  up_to_date: "bg-[#38bdf8]",
  want_to_watch: "bg-[#ff9f0a]",
  watched: "bg-[#30d158]",
  abandoned: "bg-danger-500",
};

function Breakdown({
  statusCounts,
  total,
}: {
  statusCounts: Record<DisplaySeriesStatus, number>;
  total: number;
}) {
  const { t } = useI18n();
  if (total === 0) return null;

  const segments = DISPLAY_SERIES_STATUSES.filter((status) => statusCounts[status] > 0);
  const statusLabels: Record<DisplaySeriesStatus, string> = {
    watching: t("watching"),
    up_to_date: t("upToDate"),
    want_to_watch: t("wantToWatch"),
    watched: t("watched"),
    abandoned: t("abandoned"),
  };

  return (
    <section className="mt-8">
      <SectionHeading hint={`${total} ${t("series").toLowerCase()}`}>
        {t("libraryBreakdown")}
      </SectionHeading>

      <div className="mx-5 rounded-[14px] border border-white/[0.07] bg-ink-850 p-4">
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
          {segments.map((status, index) => (
            <div
              key={status}
              className={`bar-grow-x h-full first:rounded-l-full last:rounded-r-full ${STATUS_COLORS[status]}`}
              style={{
                width: `${Math.max((statusCounts[status] / total) * 100, 2)}%`,
                animationDelay: `${index * 70}ms`,
              }}
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3.5">
          {DISPLAY_SERIES_STATUSES.map((status) => (
            <Link
              key={status}
              to={`/library?status=${status}`}
              className="tap-none group flex items-center gap-2.5 active:opacity-70"
            >
              <span className={`size-2 shrink-0 rounded-full ${STATUS_COLORS[status]}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-[1rem] leading-none font-bold tabular-nums text-white">
                  {statusCounts[status]}
                </span>
                <span className="mt-1 block truncate text-[0.75rem] text-mist-500">
                  {statusLabels[status]}
                </span>
              </span>
              <span className="shrink-0 text-[0.75rem] tabular-nums text-mist-500">
                {Math.round((statusCounts[status] / total) * 100)}%
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Genres({ genres }: { genres: GenreCount[] }) {
  const { t } = useI18n();
  if (genres.length === 0) return null;
  const max = genres[0].count;

  return (
    <section className="mt-8">
      <SectionHeading>{t("topGenres")}</SectionHeading>
      <div className="mx-5 space-y-3.5 rounded-[14px] border border-white/[0.07] bg-ink-850 p-4">
        {genres.map((entry, index) => (
          <div key={entry.genre} className="flex items-center gap-3">
            <span className="w-26 shrink-0 truncate text-[0.8125rem] text-mist-300">{entry.genre}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
              <span
                className="bar-grow-x block h-full rounded-full bg-accent-500"
                style={{
                  width: `${Math.max((entry.count / max) * 100, 3)}%`,
                  animationDelay: `${index * 55}ms`,
                }}
              />
            </span>
            <span className="w-5 shrink-0 text-right text-[0.8125rem] font-semibold tabular-nums text-white">
              {entry.count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Ratings({ ratings }: { ratings: RatingSummary }) {
  const { t } = useI18n();
  if (ratings.total === 0) return null;

  const max = Math.max(...ratings.buckets.map((bucket) => bucket.count), 1);
  const mode = ratings.buckets.reduce((best, bucket) => (bucket.count > best.count ? bucket : best));

  return (
    <section className="mt-8">
      <SectionHeading hint={`avg ${ratings.average?.toFixed(1)} ★`}>
        {t("ratingDistribution")}
      </SectionHeading>

      <div className="mx-5 rounded-[14px] border border-white/[0.07] bg-ink-850 p-4">
        <div className="flex h-28 items-end gap-1">
          {ratings.buckets.map((bucket, index) => {
            const bar = (
              <div
                className={`bar-grow-y w-full rounded-t-[3px] ${
                  bucket.count === 0
                    ? "bg-white/[0.08]"
                    : bucket.rating === mode.rating
                      ? "bg-accent-500"
                      : "bg-accent-500/35"
                }`}
                style={{
                  height: bucket.count === 0 ? "2px" : `${Math.max((bucket.count / max) * 100, 8)}%`,
                  animationDelay: `${index * 35}ms`,
                }}
              />
            );

            return (
              <div key={bucket.rating} className="flex h-full flex-1 flex-col justify-end">
                {bucket.count > 0 ? (
                  <Link
                    to={`/library?view=rated&rating=${bucket.rating}`}
                    aria-label={`${plural(bucket.count, "series", "series")} rated ${bucket.rating} stars`}
                    title={`${bucket.rating} ★ · ${plural(bucket.count, "series", "series")}`}
                    className="tap-none flex h-full w-full flex-col justify-end active:opacity-70"
                  >
                    {bar}
                  </Link>
                ) : (
                  bar
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex gap-1 border-t border-white/[0.08] pt-2">
          {ratings.buckets.map((bucket) => (
            <span key={bucket.rating} className="flex-1 text-center text-[0.6875rem] tabular-nums text-mist-500">
              {Number.isInteger(bucket.rating) ? bucket.rating : ""}
            </span>
          ))}
        </div>

        <p className="mt-3 text-[0.8125rem] text-mist-400">
          <span className="font-semibold text-white">{mode.rating} ★</span> ·{" "}
          {plural(ratings.total, "rating", "ratings")}
        </p>
      </div>
    </section>
  );
}

export function StatsScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data: library, isLoading } = useLibrary();
  const { data: streak } = useWatchStreak();
  const [shareOpen, setShareOpen] = useState(false);

  const insights = useMemo(() => computeLibraryInsights(library ?? []), [library]);
  const completionRate =
    insights.seriesTracked > 0 ? Math.round((insights.finished / insights.seriesTracked) * 100) : 0;

  return (
    <>
      <header className="ios-material sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 pt-[calc(env(safe-area-inset-top)+0.625rem)] pb-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="tap-none flex size-8 items-center justify-center rounded-full border border-white/10 bg-ink-850 text-white transition-colors hover:bg-ink-800 active:opacity-70"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-[1.25rem] font-extrabold tracking-[-0.025em] text-white">{t("stats")}</h1>
        </div>
        {!isLoading && insights.seriesTracked > 0 ? (
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label={t("shareWatchDna")}
            className="tap-none flex items-center gap-1.5 rounded-full border border-accent-500/35 bg-accent-500/15 px-3 py-1.5 text-[0.75rem] font-semibold text-accent-400 transition-colors hover:bg-accent-500/25 active:opacity-75"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5">
              <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 15V3M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{t("shareWatchDna")}</span>
          </button>
        ) : null}
      </header>

      <StatsShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        watchTimeMinutes={insights.watchTimeMinutes}
        episodesWatched={insights.episodesWatched}
        seriesTracked={insights.seriesTracked}
        finished={insights.finished}
        topGenres={insights.topGenres}
      />

      {isLoading ? (
        <div className="mt-4 space-y-8 px-5">
          <Skeleton className="h-44 w-full rounded-[20px]" />
          <Skeleton className="h-28 w-full rounded-[14px]" />
          <Skeleton className="h-40 w-full rounded-[14px]" />
        </div>
      ) : (
        <>
          <section className="mt-4 px-5">
            <div className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-ink-850 px-5 pt-5 pb-4">
              <p className="relative text-[0.75rem] font-bold uppercase tracking-[0.04em] text-mist-400">
                {t("totalWatchTime")}
              </p>
              <Duration
                minutes={insights.watchTimeMinutes}
                className="relative mt-1.5 block text-[2.625rem] leading-none font-bold tracking-[-0.03em] tabular-nums text-white"
              />

              <div className="relative mt-5 grid grid-cols-4 gap-2 border-t border-white/[0.08] pt-3.5">
                <InlineStat value={insights.episodesWatched} label={t("episodes").toLowerCase()} />
                <InlineStat value={insights.seriesTracked} label={t("series").toLowerCase()} />
                <InlineStat value={insights.finished} label={t("finishedLabel")} />
                <InlineStat value={`${completionRate}%`} label={t("completionRate")} />
              </div>
            </div>
          </section>

          <section className="mt-3 grid grid-cols-3 gap-2.5 px-5">
            <div className="rounded-[14px] border border-white/[0.07] bg-ink-850 px-3 py-3 text-center">
              <p className="text-[1.1875rem] leading-none font-extrabold tabular-nums text-[#ff9f0a]">
                {streak ?? 0}
              </p>
              <p className="mt-1 truncate text-[0.6875rem] font-medium text-mist-400">
                {t("dayStreak")}
              </p>
            </div>
            <Link
              to="/library?view=favorites"
              className="tap-none rounded-[14px] border border-white/[0.07] bg-ink-850 px-3 py-3 text-center transition-colors hover:bg-ink-800 active:opacity-80"
            >
              <p className="text-[1.1875rem] leading-none font-extrabold tabular-nums text-white">
                {insights.favorites}
              </p>
              <p className="mt-1 truncate text-[0.6875rem] font-medium text-mist-400">
                {t("favorites")}
              </p>
            </Link>
            <Link
              to="/library?view=rewatched"
              className="tap-none rounded-[14px] border border-white/[0.07] bg-ink-850 px-3 py-3 text-center transition-colors hover:bg-ink-800 active:opacity-80"
            >
              <p className="text-[1.1875rem] leading-none font-extrabold tabular-nums text-white">
                {insights.rewatches}
              </p>
              <p className="mt-1 truncate text-[0.6875rem] font-medium text-mist-400">
                {t("rewatches")}
              </p>
            </Link>
          </section>

          <Breakdown statusCounts={insights.statusCounts} total={insights.seriesTracked} />

          <Genres genres={insights.topGenres} />

          <Ratings ratings={insights.ratings} />

          {insights.mostWatched ? (
            <section className="mt-8 pb-8">
              <SectionHeading>{t("mostWatched")}</SectionHeading>
              <div className="px-5">
                <Link
                  to={`/series/${insights.mostWatched.tmdbId}`}
                  className="tap-none relative block overflow-hidden rounded-[14px] border border-white/[0.07] bg-ink-850 active:opacity-85"
                >
                  {backdropUrl(insights.mostWatched.backdropPath) ? (
                    <img
                      src={backdropUrl(insights.mostWatched.backdropPath)!}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover opacity-50"
                    />
                  ) : null}
                  <div className="hero-scrim absolute inset-0" />
                  <div className="relative flex items-center gap-4 p-4">
                    <SeriesPoster
                      path={insights.mostWatched.posterPath}
                      alt={insights.mostWatched.name}
                      className="w-[60px] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[1.0625rem] font-bold tracking-[-0.015em] text-white">
                        {insights.mostWatched.name}
                      </p>
                      <p className="mt-1 text-[0.8125rem] text-mist-300">
                        {insights.mostWatched.watchedEpisodes} {t("episodes").toLowerCase()}
                      </p>
                      {insights.mostWatched.episodeRuntime > 0 ? (
                        <p className="mt-0.5 text-[0.75rem] text-mist-500">
                          <Duration
                            minutes={insights.mostWatched.watchedEpisodes * insights.mostWatched.episodeRuntime}
                            className="font-semibold text-mist-400"
                          />
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </div>
            </section>
          ) : null}
        </>
      )}
    </>
  );
}
