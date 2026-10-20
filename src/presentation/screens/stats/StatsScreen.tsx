import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { backdropUrl } from "@/data/tmdb/images";
import { computeLibraryInsights, type GenreCount } from "@/domain/entities/LibraryInsights";
import type { RatingSummary } from "@/domain/entities/RatingSummary";
import {
  DISPLAY_SERIES_STATUS_LABELS,
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
import { plural, pluralize } from "@/presentation/utils/plural";

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
  if (total === 0) return null;

  const segments = DISPLAY_SERIES_STATUSES.filter((status) => statusCounts[status] > 0);

  return (
    <section className="mt-8">
      <SectionHeading hint={plural(total, "series", "series")}>Library breakdown</SectionHeading>

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
                  {DISPLAY_SERIES_STATUS_LABELS[status]}
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
  if (genres.length === 0) return null;
  const max = genres[0].count;

  return (
    <section className="mt-8">
      <SectionHeading hint="series per genre">Top genres</SectionHeading>
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
  if (ratings.total === 0) return null;

  const max = Math.max(...ratings.buckets.map((bucket) => bucket.count), 1);
  const mode = ratings.buckets.reduce((best, bucket) => (bucket.count > best.count ? bucket : best));

  return (
    <section className="mt-8">
      <SectionHeading hint={`avg ${ratings.average?.toFixed(1)} ★`}>
        Your ratings
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
          Most often you go with{" "}
          <span className="font-semibold text-white">{mode.rating} ★</span> ·{" "}
          {plural(ratings.total, "rating", "ratings")} total
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
      <div className="flex items-center gap-2 px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="tap-none -ml-2 flex size-9 items-center justify-center rounded-full border border-white/10 bg-ink-850 text-white transition-colors hover:bg-ink-800 active:opacity-70"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-[1.25rem] font-bold tracking-[-0.02em] text-white">{t("stats")}</h1>
        {!isLoading && insights.seriesTracked > 0 ? (
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share your Watch DNA"
            className="tap-none ml-auto flex size-9 items-center justify-center rounded-full border border-white/10 bg-ink-850 text-white transition-colors hover:bg-ink-800 active:opacity-70"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]">
              <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 15V3M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>

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
          <section className="px-5">
            <div className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-ink-850 px-6 pt-6 pb-5">
              <p className="relative text-[0.8125rem] font-semibold text-mist-500">
                Total watch time
              </p>
              <Duration
                minutes={insights.watchTimeMinutes}
                className="relative mt-2 block text-[3rem] leading-none font-bold tracking-[-0.03em] tabular-nums text-white"
              />

              <div className="relative mt-6 grid grid-cols-4 gap-2 border-t border-white/[0.08] pt-4">
                <InlineStat value={insights.episodesWatched} label="episodes" />
                <InlineStat value={insights.seriesTracked} label="series" />
                <InlineStat value={insights.finished} label="finished" />
                <InlineStat value={`${completionRate}%`} label={t("completionRate")} />
              </div>
            </div>
          </section>

          <section className="mt-3.5 px-5">
            <div className="flex items-center gap-4 rounded-[14px] border border-white/[0.07] bg-ink-850 px-5 py-4">
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                  streak && streak > 0 ? "bg-[#ff9f0a]/15 text-[#ff9f0a]" : "bg-ink-800 text-mist-500"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
                  <path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 6 0c0-1 0-2-1-3 2 1 4 4 4 8a8 8 0 0 1-16 0c0-3 2-5 3-7 1 2 2 2 3 1 0-2-1-3-1-5z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                {streak && streak > 0 ? (
                  <>
                    <p className="text-[1.125rem] leading-none font-bold text-white">
                      <span className="text-[#ff9f0a]">{streak}</span>{" "}
                      {pluralize(streak, "day", "days")} streak
                    </p>
                    <p className="mt-1.5 text-[0.75rem] text-mist-500">
                      Days in a row you checked off an episode, one by one.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[0.9375rem] font-semibold text-white">No active streak</p>
                    <p className="mt-1 text-[0.75rem] text-mist-500">
                      Check off an episode one by one to start one — bulk actions don’t count.
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>

          <Breakdown statusCounts={insights.statusCounts} total={insights.seriesTracked} />

          <Genres genres={insights.topGenres} />

          <Ratings ratings={insights.ratings} />

          {insights.mostWatched ? (
            <section className="mt-8">
              <SectionHeading>Most watched</SectionHeading>
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
                        {plural(insights.mostWatched.watchedEpisodes, "episode", "episodes")} watched
                      </p>
                      {insights.mostWatched.episodeRuntime > 0 ? (
                        <p className="mt-0.5 text-[0.75rem] text-mist-500">
                          that is{" "}
                          <Duration
                            minutes={insights.mostWatched.watchedEpisodes * insights.mostWatched.episodeRuntime}
                            className="font-semibold text-mist-400"
                          />{" "}
                          of your life
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </div>
            </section>
          ) : null}

          <section className="mt-6 px-5 pb-10">
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/library?view=favorites"
                className="tap-none flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-ink-850 px-4 py-3.5 transition-colors hover:bg-ink-800 active:opacity-80"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-[18px] shrink-0 text-danger-500">
                  <path d="M12 21.23l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
                </svg>
                <div>
                  <p className="text-[1.125rem] leading-none font-bold tabular-nums text-white">{insights.favorites}</p>
                  <p className="mt-1 text-[0.75rem] font-medium text-mist-500">favorites</p>
                </div>
              </Link>
              <Link
                to="/library?view=rewatched"
                className="tap-none flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-ink-850 px-4 py-3.5 transition-colors hover:bg-ink-800 active:opacity-80"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-[18px] shrink-0 text-accent-500"
                >
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-[1.125rem] leading-none font-bold tabular-nums text-white">{insights.rewatches}</p>
                  <p className="mt-1 text-[0.75rem] font-medium text-mist-500">rewatches</p>
                </div>
              </Link>
            </div>
          </section>
        </>
      )}
    </>
  );
}
