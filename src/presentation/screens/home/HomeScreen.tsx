import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { backdropUrl } from "@/data/tmdb/images";
import type { UpNextItem } from "@/domain/entities/Progress";
import { releaseYear, type SeriesSummary } from "@/domain/entities/Series";
import { NotificationSheet } from "@/presentation/components/notifications/NotificationSheet";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useGenres, useInfiniteDiscover, useRecommendations, useTrending } from "@/presentation/hooks/useDiscovery";
import { useInfiniteScroll } from "@/presentation/hooks/useInfiniteScroll";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useUnreadCount } from "@/presentation/hooks/useNotifications";
import { useLibrary, useMarkUpNext, useUpNext } from "@/presentation/hooks/useTracking";

function Hero({ series }: { series: SeriesSummary }) {
  const backdrop = backdropUrl(series.backdropPath, "w1280");

  return (
    <Link to={`/series/${series.tmdbId}`} className="tap-none relative block overflow-hidden active:opacity-90">
      <div className="relative h-[220px] w-full overflow-hidden bg-ink-800 md:h-[300px] md:rounded-card">
        {backdrop ? (
          <img src={backdrop} alt="" className="size-full object-cover" fetchPriority="high" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[11px] font-semibold tracking-wide text-accent-400 uppercase">
            Trending now
          </p>
          <h2 className="mt-1 text-[24px] leading-tight font-bold text-mist-100">{series.name}</h2>
          {series.overview ? (
            <p className="mt-1.5 line-clamp-2 max-w-lg text-[13px] text-mist-300">{series.overview}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function UpNextCard({ item }: { item: UpNextItem }) {
  const mark = useMarkUpNext();

  return (
    <div className="w-[132px] shrink-0">
      <Link to={`/series/${item.tmdbId}`} className="tap-none block active:opacity-70">
        <SeriesPoster path={item.posterPath} alt={item.name} />
        <p className="mt-2 truncate text-[13px] font-semibold text-mist-100">{item.name}</p>
      </Link>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium tabular-nums text-accent-400">
          S{item.nextSeason} · E{item.nextEpisode}
        </span>
        <button
          type="button"
          disabled={mark.isPending}
          aria-label={`Mark S${item.nextSeason} E${item.nextEpisode} watched`}
          onClick={() =>
            mark.mutate({
              seriesId: item.seriesId,
              tmdbId: item.tmdbId,
              nextSeason: item.nextSeason,
              nextEpisode: item.nextEpisode,
            })
          }
          className="tap-none flex size-7 shrink-0 items-center justify-center rounded-full border border-ink-600 text-mist-400 transition-colors active:border-accent-500 active:bg-accent-500 active:text-white disabled:opacity-50"
        >
          {mark.isPending ? (
            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3.5">
              <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function UpNextRail() {
  const { data, isLoading } = useUpNext();

  if (isLoading) {
    return (
      <div className="flex h-28 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="mt-7">
      <h2 className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        Up Next
      </h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {data.map((item) => (
          <UpNextCard key={item.seriesId} item={item} />
        ))}
      </div>
    </section>
  );
}

function RecommendationsRail() {
  const { data: library } = useLibrary();

  const seedTmdbId = useMemo(() => {
    if (!library || library.length === 0) return null;
    const watching = library.filter((item) => item.status === "watching" || item.status === "watched");
    const pool = watching.length > 0 ? watching : library;
    return pool[Math.floor(Math.random() * pool.length)].tmdbId;
  }, [library]);

  const { data: recs } = useRecommendations(seedTmdbId);

  if (!recs || recs.results.length === 0) {
    return null;
  }

  return (
    <section className="mt-7">
      <h2 className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        Recommended for You
      </h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {recs.results.slice(0, 15).map((item) => (
          <Link
            key={item.tmdbId}
            to={`/series/${item.tmdbId}`}
            className="tap-none w-[132px] shrink-0 active:opacity-70"
          >
            <SeriesPoster path={item.posterPath} alt={item.name} />
            <p className="mt-2 truncate text-[13px] font-semibold text-mist-100">{item.name}</p>
            {item.firstAirDate ? (
              <p className="mt-0.5 text-[11px] text-mist-400">{releaseYear(item)}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

function EndlessGrid() {
  const [genreId, setGenreId] = useState<number | null>(null);
  const { data: genres } = useGenres();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteDiscover(genreId);

  const sentinelRef = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const series = data?.pages.flatMap((page) => page.results) ?? [];
  const seen = new Set<number>();
  const unique = series.filter((item) => {
    if (seen.has(item.tmdbId)) {
      return false;
    }
    seen.add(item.tmdbId);
    return true;
  });

  return (
    <section className="mt-8">
      <h2 className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        Browse
      </h2>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto px-5">
        <button
          type="button"
          onClick={() => setGenreId(null)}
          className={`tap-none min-h-[34px] shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${
            genreId === null ? "bg-accent-600 text-white" : "bg-ink-800 text-mist-400 active:bg-ink-700"
          }`}
        >
          Popular
        </button>
        {(genres ?? []).map((genre) => (
          <button
            key={genre.id}
            type="button"
            onClick={() => setGenreId(genre.id)}
            className={`tap-none min-h-[34px] shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              genreId === genre.id
                ? "bg-accent-600 text-white"
                : "bg-ink-800 text-mist-400 active:bg-ink-700"
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {unique.map((item) => (
            <SeriesCard
              key={item.tmdbId}
              tmdbId={item.tmdbId}
              name={item.name}
              posterPath={item.posterPath}
              year={releaseYear(item)}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-px" />

      {isFetchingNextPage ? (
        <div className="flex h-16 items-center justify-center">
          <Spinner />
        </div>
      ) : null}

      {!hasNextPage && unique.length > 0 ? (
        <p className="py-8 text-center text-[12px] text-mist-500">You have reached the end.</p>
      ) : null}
    </section>
  );
}

export function HomeScreen() {
  const { profile } = useAuth();
  const { data: trending } = useTrending();
  const { data: unreadCount } = useUnreadCount();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const featured = trending?.results[0];

  return (
    <>
      <header className="flex items-start justify-between px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-4">
        <div>
          <p className="text-[13px] text-mist-400">
            {profile ? `Welcome back, ${profile.displayName || profile.username}` : "Welcome"}
          </p>
          <h1 className="text-[28px] font-bold tracking-tight text-mist-100">Episodic</h1>
        </div>
        <button
          type="button"
          onClick={() => setNotificationsOpen(true)}
          className="tap-none relative mt-2 flex size-10 items-center justify-center rounded-full bg-ink-800 text-mist-300 active:bg-ink-700"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {(unreadCount ?? 0) > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-accent-600 text-[10px] font-bold text-white">
              {unreadCount! > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </header>

      {featured ? (
        <div className="md:px-5">
          <Hero series={featured} />
        </div>
      ) : null}

      <UpNextRail />
      <RecommendationsRail />
      <EndlessGrid />

      <NotificationSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}
