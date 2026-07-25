import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { backdropUrl } from "@/data/tmdb/images";
import { computeLibraryInsights, type GenreCount } from "@/domain/entities/LibraryInsights";
import type { RatingSummary } from "@/domain/entities/RatingSummary";
import { SERIES_STATUS_LABELS, SERIES_STATUSES, type SeriesStatus } from "@/domain/entities/SeriesStatus";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { Skeleton } from "@/presentation/components/ui/Skeleton";
import { useLibrary } from "@/presentation/hooks/useTracking";
import { plural } from "@/presentation/utils/plural";

const STATUS_COLORS: Record<SeriesStatus, string> = {
  watching: "bg-[#3b82f6]",
  want_to_watch: "bg-[#d97706]",
  watched: "bg-[#059669]",
  abandoned: "bg-[#f43f5e]",
};

function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  if (hours < 1) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-[13px] font-semibold tracking-wide text-mist-400 uppercase">{children}</h2>
      {hint ? <span className="text-[11px] text-mist-500">{hint}</span> : null}
    </div>
  );
}

function HeadlineStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="px-2 py-1 text-center">
      <p className="text-[19px] leading-none font-bold text-mist-100">{value}</p>
      <p className="mt-1 text-[10px] tracking-wide text-mist-500 uppercase">{label}</p>
    </div>
  );
}

function CompositionBar({
  statusCounts,
  total,
}: {
  statusCounts: Record<SeriesStatus, number>;
  total: number;
}) {
  if (total === 0) return null;

  const segments = SERIES_STATUSES.filter((status) => statusCounts[status] > 0);

  return (
    <section className="mt-7 px-5">
      <SectionTitle hint={`${total} series`}>Library Breakdown</SectionTitle>
      <div className="rounded-card bg-ink-850 p-4">
        <div className="flex h-6 gap-0.5 overflow-hidden">
          {segments.map((status, index) => (
            <div
              key={status}
              title={`${SERIES_STATUS_LABELS[status]} · ${statusCounts[status]}`}
              className={`bar-grow-x h-full ${STATUS_COLORS[status]} ${index === 0 ? "rounded-l" : ""} ${
                index === segments.length - 1 ? "rounded-r" : ""
              }`}
              style={{
                width: `${Math.max((statusCounts[status] / total) * 100, 2)}%`,
                animationDelay: `${index * 70}ms`,
              }}
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-2.5 gap-y-2">
          {SERIES_STATUSES.map((status) => (
            <Link
              key={status}
              to={`/library?status=${status}`}
              className="tap-none flex items-baseline gap-1.5 rounded-lg px-1 py-1 active:bg-ink-800"
            >
              <span className={`size-2.5 shrink-0 -translate-y-px rounded-full ${STATUS_COLORS[status]}`} />
              <span className="min-w-0 flex-1 text-[11px] leading-tight text-mist-400">
                {SERIES_STATUS_LABELS[status]}
              </span>
              <span className="shrink-0 text-[13px] font-semibold text-mist-100">{statusCounts[status]}</span>
              <span className="shrink-0 text-[10px] text-mist-500">
                {Math.round((statusCounts[status] / total) * 100)}%
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function GenreBars({ genres }: { genres: GenreCount[] }) {
  if (genres.length === 0) return null;
  const max = genres[0].count;

  return (
    <section className="mt-7 px-5">
      <SectionTitle>Top Genres</SectionTitle>
      <div className="space-y-3 rounded-card bg-ink-850 p-4">
        {genres.map((entry, index) => (
          <div key={entry.genre} className="flex items-center gap-3">
            <span className="w-26 shrink-0 truncate text-[11px] text-mist-300">{entry.genre}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-r bg-accent-500/10">
              <div
                className="bar-grow-x h-full rounded-r bg-accent-500"
                style={{
                  width: `${Math.max((entry.count / max) * 100, 3)}%`,
                  animationDelay: `${index * 60}ms`,
                }}
              />
            </div>
            <span className="w-7 shrink-0 text-right text-[12px] font-semibold text-mist-200">
              {entry.count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RatingsHistogram({ ratings }: { ratings: RatingSummary }) {
  if (ratings.total === 0) return null;

  const max = Math.max(...ratings.buckets.map((bucket) => bucket.count), 1);
  const mode = ratings.buckets.reduce((best, bucket) => (bucket.count > best.count ? bucket : best));

  return (
    <section className="mt-7 px-5">
      <SectionTitle hint={`${plural(ratings.total, "rating", "ratings")} · avg ${ratings.average?.toFixed(1)} ★`}>
        Your Ratings
      </SectionTitle>
      <div className="rounded-card bg-ink-850 p-4">
        <div className="flex h-24 items-end gap-0.5">
          {ratings.buckets.map((bucket, index) => (
            <div key={bucket.rating} className="flex h-full flex-1 flex-col justify-end">
              <div
                title={`${bucket.rating} ★ · ${bucket.count}`}
                className={`bar-grow-y w-full rounded-t ${
                  bucket.count === 0
                    ? "bg-ink-700"
                    : bucket.rating === mode.rating
                      ? "bg-accent-400"
                      : "bg-mist-500/35"
                }`}
                style={{
                  height: bucket.count === 0 ? "3px" : `${Math.max((bucket.count / max) * 100, 6)}%`,
                  animationDelay: `${index * 40}ms`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-0.5">
          {ratings.buckets.map((bucket) => (
            <span key={bucket.rating} className="flex-1 text-center text-[9px] text-mist-500">
              {Number.isInteger(bucket.rating) ? bucket.rating : ""}
            </span>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-mist-500">
          You rate <span className="font-semibold text-mist-300">{mode.rating} ★</span> more than anything
          else
        </p>
      </div>
    </section>
  );
}

export function StatsScreen() {
  const navigate = useNavigate();
  const { data: library, isLoading } = useLibrary();

  const insights = useMemo(() => computeLibraryInsights(library ?? []), [library]);

  return (
    <>
      <div className="flex items-center gap-2 px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="tap-none -ml-2 flex size-10 items-center justify-center rounded-full text-mist-300 active:bg-ink-800"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-[22px] font-bold tracking-tight text-mist-100">Your Stats</h1>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-4 px-5">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-card" />
          <Skeleton className="h-52 w-full rounded-card" />
        </div>
      ) : (
        <>
          <section className="mt-4 px-5">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-600/25 via-ink-850 to-ink-850 p-5 ring-1 ring-white/5 ring-inset">
              <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-accent-500/10 blur-2xl" />
              <p className="text-[12px] font-medium tracking-wide text-mist-400 uppercase">Total watch time</p>
              <p className="mt-1 text-[48px] leading-none font-bold text-mist-100">
                {formatHours(insights.watchTimeMinutes)}
              </p>

              <div className="mt-5 grid grid-cols-3 divide-x divide-white/5 rounded-xl bg-ink-950/40 py-3">
                <HeadlineStat value={insights.episodesWatched} label="Episodes" />
                <HeadlineStat value={insights.seriesTracked} label="Series" />
                <HeadlineStat value={insights.finished} label="Finished" />
              </div>
            </div>
          </section>

          <CompositionBar statusCounts={insights.statusCounts} total={insights.seriesTracked} />

          <GenreBars genres={insights.topGenres} />

          <RatingsHistogram ratings={insights.ratings} />

          {insights.mostWatched ? (
            <section className="mt-7 px-5">
              <SectionTitle>Most Watched</SectionTitle>
              <Link
                to={`/series/${insights.mostWatched.tmdbId}`}
                className="tap-none relative block overflow-hidden rounded-card active:opacity-90"
              >
                {backdropUrl(insights.mostWatched.backdropPath) ? (
                  <img
                    src={backdropUrl(insights.mostWatched.backdropPath)!}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover opacity-40"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/60 to-ink-950/30" />
                <div className="relative flex items-center gap-4 p-4">
                  <SeriesPoster
                    path={insights.mostWatched.posterPath}
                    alt={insights.mostWatched.name}
                    className="w-16 shrink-0 shadow-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px] font-bold text-mist-100">{insights.mostWatched.name}</p>
                    <p className="mt-1 text-[13px] text-mist-300">
                      {plural(insights.mostWatched.watchedEpisodes, "episode", "episodes")} watched
                    </p>
                    {insights.mostWatched.episodeRuntime > 0 ? (
                      <p className="mt-0.5 text-[12px] text-mist-400">
                        ≈ {formatHours(insights.mostWatched.watchedEpisodes * insights.mostWatched.episodeRuntime)}{" "}
                        of your life
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            </section>
          ) : null}

          <section className="mt-3 px-5 pb-8">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2.5 rounded-xl bg-ink-850 px-4 py-3">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0 text-rose-400">
                  <path d="M12 21.23l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
                </svg>
                <div>
                  <p className="text-[16px] leading-none font-bold text-mist-100">{insights.favorites}</p>
                  <p className="mt-0.5 text-[10px] tracking-wide text-mist-500 uppercase">Favorites</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-ink-850 px-4 py-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 shrink-0 text-accent-400">
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-[16px] leading-none font-bold text-mist-100">{insights.rewatches}</p>
                  <p className="mt-0.5 text-[10px] tracking-wide text-mist-500 uppercase">Rewatches</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
