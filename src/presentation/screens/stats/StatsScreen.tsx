import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { computeLibraryInsights, type GenreCount } from "@/domain/entities/LibraryInsights";
import { SERIES_STATUS_LABELS, SERIES_STATUSES, type SeriesStatus } from "@/domain/entities/SeriesStatus";
import { RatingSummaryCard } from "@/presentation/components/reviews/RatingSummaryCard";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { Skeleton } from "@/presentation/components/ui/Skeleton";
import { useLibrary } from "@/presentation/hooks/useTracking";
import { plural } from "@/presentation/utils/plural";

const STATUS_DOTS: Record<SeriesStatus, string> = {
  want_to_watch: "bg-sky-400",
  watching: "bg-accent-400",
  watched: "bg-emerald-400",
  abandoned: "bg-mist-500",
};

function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  if (hours < 1) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function HeadlineStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="px-2 py-1 text-center">
      <p className="text-[19px] leading-none font-bold tabular-nums text-mist-100">{value}</p>
      <p className="mt-1 text-[10px] tracking-wide text-mist-500 uppercase">{label}</p>
    </div>
  );
}

function GenreBars({ genres }: { genres: GenreCount[] }) {
  if (genres.length === 0) return null;
  const max = genres[0].count;

  return (
    <section className="mt-7 px-5">
      <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">Top Genres</h2>
      <div className="space-y-2.5 rounded-card bg-ink-850 p-4">
        {genres.map((entry) => (
          <div key={entry.genre} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-[12px] text-mist-300">{entry.genre}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-950/60">
              <div
                className="h-full rounded-full bg-accent-500/80"
                style={{ width: `${Math.max((entry.count / max) * 100, 4)}%` }}
              />
            </div>
            <span className="w-7 shrink-0 text-right text-[12px] font-semibold tabular-nums text-mist-200">
              {entry.count}
            </span>
          </div>
        ))}
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
          <Skeleton className="h-52 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
      ) : (
        <>
          <section className="mt-4 px-5">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-600/25 via-ink-850 to-ink-850 p-5 ring-1 ring-white/5 ring-inset">
              <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-accent-500/10 blur-2xl" />
              <p className="text-[12px] font-medium tracking-wide text-mist-400 uppercase">Total watch time</p>
              <p className="mt-1 text-[44px] leading-none font-bold tabular-nums text-mist-100">
                {formatHours(insights.watchTimeMinutes)}
              </p>

              <div className="mt-5 grid grid-cols-3 divide-x divide-white/5 rounded-xl bg-ink-950/40 py-3">
                <HeadlineStat value={insights.episodesWatched} label="Episodes" />
                <HeadlineStat value={insights.seriesTracked} label="Series" />
                <HeadlineStat value={insights.finished} label="Finished" />
              </div>
            </div>
          </section>

          <section className="mt-3 px-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SERIES_STATUSES.map((status) => (
                <Link
                  key={status}
                  to={`/library?status=${status}`}
                  className="tap-none flex items-center gap-2 rounded-xl bg-ink-850 px-3 py-2.5 active:bg-ink-800"
                >
                  <span className={`size-2 shrink-0 rounded-full ${STATUS_DOTS[status]}`} />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-mist-400">
                    {SERIES_STATUS_LABELS[status]}
                  </span>
                  <span className="text-[14px] font-bold tabular-nums text-mist-100">
                    {insights.statusCounts[status]}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <GenreBars genres={insights.topGenres} />

          {insights.ratings.total > 0 ? (
            <section className="mt-7 px-5">
              <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
                Your Ratings
                <span className="ml-1.5 text-mist-600">avg {insights.ratings.average?.toFixed(1)}</span>
              </h2>
              <RatingSummaryCard summary={insights.ratings} />
            </section>
          ) : null}

          {insights.mostWatched ? (
            <section className="mt-7 px-5">
              <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
                Most Watched
              </h2>
              <Link
                to={`/series/${insights.mostWatched.tmdbId}`}
                className="tap-none flex items-center gap-4 rounded-card bg-ink-850 p-4 active:bg-ink-800"
              >
                <SeriesPoster
                  path={insights.mostWatched.posterPath}
                  alt={insights.mostWatched.name}
                  className="w-16 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-bold text-mist-100">{insights.mostWatched.name}</p>
                  <p className="mt-1 text-[13px] text-mist-400">
                    {plural(insights.mostWatched.watchedEpisodes, "episode", "episodes")} watched
                  </p>
                  {insights.mostWatched.episodeRuntime > 0 ? (
                    <p className="mt-0.5 text-[12px] text-mist-500">
                      ≈ {formatHours(insights.mostWatched.watchedEpisodes * insights.mostWatched.episodeRuntime)} of
                      your life
                    </p>
                  ) : null}
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
                  <p className="text-[16px] leading-none font-bold tabular-nums text-mist-100">
                    {insights.favorites}
                  </p>
                  <p className="mt-0.5 text-[10px] tracking-wide text-mist-500 uppercase">Favorites</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-ink-850 px-4 py-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 shrink-0 text-accent-400">
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-[16px] leading-none font-bold tabular-nums text-mist-100">
                    {insights.rewatches}
                  </p>
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
