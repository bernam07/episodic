import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { backdropUrl } from "@/data/tmdb/images";
import type { UpNextItem } from "@/domain/entities/Progress";
import { releaseYear, type SeriesSummary } from "@/domain/entities/Series";
import { NotificationSheet } from "@/presentation/components/notifications/NotificationSheet";
import { InLibraryBadge, RatingBadge, WatchedBadge } from "@/presentation/components/series/SeriesCard";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { ActivityRow } from "@/presentation/components/social/ActivityRow";
import { RailSkeleton } from "@/presentation/components/ui/Skeleton";
import { useFriendsFeed } from "@/presentation/hooks/useActivity";
import { useRecommendations, useTrending } from "@/presentation/hooks/useDiscovery";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useUnreadCount } from "@/presentation/hooks/useNotifications";
import {
  useLibrary,
  useMarkUpNext,
  useMyLibraryStatus,
  useMyRatings,
  useMyWatched,
  useUpNext,
} from "@/presentation/hooks/useTracking";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

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

function UpNextCard({ item, rating }: { item: UpNextItem; rating: number | null }) {
  const mark = useMarkUpNext();

  return (
    <div className="w-[132px] shrink-0">
      <Link to={`/series/${item.tmdbId}`} className="tap-none block active:opacity-70">
        <div className="relative">
          <SeriesPoster path={item.posterPath} alt={item.name} />
          {rating ? <RatingBadge value={rating} /> : null}
        </div>
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
  const ratings = useMyRatings();

  if (isLoading) {
    return (
      <section className="mt-7">
        <h2 className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
          Up Next
        </h2>
        <RailSkeleton />
      </section>
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
          <UpNextCard key={item.seriesId} item={item} rating={ratings.get(item.tmdbId) ?? null} />
        ))}
      </div>
    </section>
  );
}

function FriendsRail() {
  const { data } = useFriendsFeed();

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="mt-7">
      <div className="mb-2 flex items-center justify-between px-5">
        <h2 className="text-[13px] font-semibold tracking-wide text-mist-400 uppercase">From Friends</h2>
        <Link to="/friends" className="tap-none text-[12px] font-semibold text-accent-400 active:text-accent-300">
          See all
        </Link>
      </div>
      <ul className="divide-y divide-ink-800 px-5">
        {data.slice(0, 4).map((event) => (
          <ActivityRow key={`${event.actorId}-${event.eventType}-${event.seriesId}-${event.occurredAt}`} event={event} />
        ))}
      </ul>
    </section>
  );
}

function RecommendationsRail() {
  const { data: library } = useLibrary();

  const seed = useMemo(() => {
    if (!library || library.length === 0) return null;
    const watched = library.filter((item) => item.status === "watching" || item.status === "watched");
    const pool = watched.length > 0 ? watched : library;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [library]);

  const { data: recs } = useRecommendations(seed?.tmdbId ?? null);

  const inLibrary = useMemo(() => new Set((library ?? []).map((item) => item.tmdbId)), [library]);
  const suggestions = useMemo(
    () => (recs?.results ?? []).filter((item) => !inLibrary.has(item.tmdbId)).slice(0, 15),
    [recs, inLibrary]
  );

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="mt-7">
      <h2 className="mb-3 truncate px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        {seed ? `Because you watched ${seed.name}` : "Recommended for You"}
      </h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {suggestions.map((item) => (
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

function TrendingRail() {
  const { data } = useTrending();
  const ratings = useMyRatings();
  const watched = useMyWatched();
  const libraryStatus = useMyLibraryStatus();
  const items = (data?.results ?? []).slice(1, 16);

  if (items.length === 0) return null;

  return (
    <section className="mt-7">
      <h2 className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        Trending This Week
      </h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {items.map((item) => {
          const rating = ratings.get(item.tmdbId) ?? null;
          return (
          <Link
            key={item.tmdbId}
            to={`/series/${item.tmdbId}`}
            className="tap-none w-[132px] shrink-0 active:opacity-70"
          >
            <div className="relative">
              <SeriesPoster path={item.posterPath} alt={item.name} />
              {rating ? (
                <RatingBadge value={rating} />
              ) : watched.has(item.tmdbId) ? (
                <WatchedBadge />
              ) : libraryStatus.has(item.tmdbId) ? (
                <InLibraryBadge status={libraryStatus.get(item.tmdbId)!} />
              ) : null}
            </div>
            <p className="mt-2 truncate text-[13px] font-semibold text-mist-100">{item.name}</p>
            {item.firstAirDate ? (
              <p className="mt-0.5 text-[11px] text-mist-400">{releaseYear(item)}</p>
            ) : null}
          </Link>
          );
        })}
      </div>
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
            {profile ? `${greeting()}, ${profile.displayName || profile.username}` : greeting()}
          </p>
          <h1 className="text-[28px] font-bold tracking-tight text-mist-100">Episodic</h1>
        </div>
        <div className="mt-2 flex gap-2">
        <Link
          to="/calendar"
          className="tap-none flex size-10 items-center justify-center rounded-full bg-ink-800 text-mist-300 active:bg-ink-700"
          aria-label="Calendar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <button
          type="button"
          onClick={() => setNotificationsOpen(true)}
          className="tap-none relative flex size-10 items-center justify-center rounded-full bg-ink-800 text-mist-300 active:bg-ink-700"
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
        </div>
      </header>

      {featured ? (
        <div className="md:px-5">
          <Hero series={featured} />
        </div>
      ) : null}

      <UpNextRail />
      <FriendsRail />
      <RecommendationsRail />
      <TrendingRail />

      <NotificationSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}
