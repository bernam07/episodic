import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { backdropUrl } from "@/data/tmdb/images";
import { computeLibraryInsights } from "@/domain/entities/LibraryInsights";
import { computeLibraryStats } from "@/domain/entities/LibraryStats";
import type { SeriesProgress } from "@/domain/entities/Progress";
import { ListsSection } from "@/presentation/components/lists/ListsSection";
import { ReviewList } from "@/presentation/components/reviews/ReviewList";
import { RatingBadge, SeriesCard } from "@/presentation/components/series/SeriesCard";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { Avatar } from "@/presentation/components/social/Avatar";
import { DeleteAccountSheet } from "@/presentation/components/social/DeleteAccountSheet";
import { DiarySection } from "@/presentation/components/social/DiarySection";
import { EditProfileSheet } from "@/presentation/components/social/EditProfileSheet";
import { FollowListSheet } from "@/presentation/components/social/FollowListSheet";
import { SettingsSheet } from "@/presentation/components/social/SettingsSheet";
import { Duration, InlineStat } from "@/presentation/components/stats/StatsPrimitives";
import { Skeleton } from "@/presentation/components/ui/Skeleton";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useOwnReviews } from "@/presentation/hooks/useReviews";
import { useProfileSummary } from "@/presentation/hooks/useSocial";
import {
  useLibrary,
  useReorderFavorites,
  useSetFavoritePinned,
  useToggleFavorite,
  useWatchStreak,
} from "@/presentation/hooks/useTracking";
import { pluralize } from "@/presentation/utils/plural";

type ProfileTab = "overview" | "watchlist" | "reviews" | "lists" | "diary";

const GENRE_BAR_COLORS = ["bg-accent-500", "bg-[#3b82f6]", "bg-[#f59e0b]"];
const GENRE_ICON_COLORS = ["text-accent-400", "text-[#60a5fa]", "text-[#fbbf24]"];

function GenreSvgIcon({ index }: { index: number }) {
  const color = GENRE_ICON_COLORS[index % GENRE_ICON_COLORS.length];
  if (index === 0) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`size-3.5 shrink-0 ${color}`}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`size-3.5 shrink-0 ${color}`}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`size-3.5 shrink-0 ${color}`}>
      <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V5z" />
    </svg>
  );
}

function Header({
  onOpenSettings,
  activeTab,
  onSelectTab,
}: {
  onOpenSettings: () => void;
  activeTab: ProfileTab;
  onSelectTab: (tab: ProfileTab) => void;
}) {
  const { profile, user } = useAuth();
  const { data: summary } = useProfileSummary(profile?.username ?? null);
  const { data: library } = useLibrary();
  const [editOpen, setEditOpen] = useState(false);
  const [followMode, setFollowMode] = useState<"followers" | "following" | null>(null);

  const fallbackBannerPath = useMemo(() => {
    if (!library || library.length === 0) return null;
    const pinned = library.find((item) => item.favoritePinnedAt && item.backdropPath);
    if (pinned?.backdropPath) return pinned.backdropPath;
    const fav = library.find((item) => item.isFavorite && item.backdropPath);
    if (fav?.backdropPath) return fav.backdropPath;
    const anyWithBackdrop = library.find((item) => item.backdropPath);
    return anyWithBackdrop?.backdropPath ?? null;
  }, [library]);

  const bannerUrl = profile?.bannerUrl || backdropUrl(fallbackBannerPath, "w1280");
  const seriesCount = summary?.seriesCount ?? library?.length ?? 0;

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "watchlist", label: "Watchlist" },
    { id: "reviews", label: "Reviews" },
    { id: "lists", label: "Lists" },
    { id: "diary", label: "Activity" },
  ];

  return (
    <header className="border-b border-white/[0.08]">
      <div className="relative h-[156px] w-full overflow-hidden bg-gradient-to-br from-accent-600/25 via-ink-900 to-ink-950 md:h-[188px]">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="size-full object-cover opacity-65" />
        ) : null}
        <div className="hero-scrim absolute inset-0" />
        <div className="pt-safe absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-3">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label="Change profile banner"
            className="ios-material tap-none inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 px-3 text-[0.75rem] font-semibold text-white transition-colors hover:bg-ink-800 active:opacity-75"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
              <path
                d="M4 8.5a2 2 0 0 1 2-2h1.2l.9-1.5h5.8l.9 1.5H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12.5" r="3" />
            </svg>
            <span>Cover</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="ios-material tap-none flex size-9 items-center justify-center rounded-full border border-white/10 text-white transition-opacity active:opacity-70 hover:bg-ink-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]">
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative -mt-10 px-5">
        <div className="flex items-end justify-between gap-4">
          <Avatar
            username={profile?.username ?? "?"}
            displayName={profile?.displayName}
            avatarUrl={profile?.avatarUrl}
            size="lg"
            ring
          />
          <div className="flex shrink-0 items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              aria-label="Edit profile"
              className="tap-none flex min-h-[36px] items-center gap-1.5 rounded-[10px] bg-accent-500 px-4 text-[0.8125rem] font-bold text-white shadow-[0_2px_10px_rgba(239,51,64,0.3)] transition-opacity hover:bg-accent-400 active:opacity-80"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5">
                <path
                  d="M4 20l4.3-.9L19.6 7.8a1.5 1.5 0 0 0 0-2.1l-1.3-1.3a1.5 1.5 0 0 0-2.1 0L4.9 15.7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Edit Profile
            </button>
          </div>
        </div>

        <div className="mt-3">
          <h1 className="truncate text-[1.375rem] font-extrabold tracking-[-0.025em] text-white">
            {profile?.displayName || profile?.username || "Profile"}
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.8125rem] text-mist-500">
            {profile ? <span>@{profile.username}</span> : null}
            {user?.email ? (
              <>
                <span>•</span>
                <span className="truncate">{user.email}</span>
              </>
            ) : null}
          </div>
        </div>

        {profile?.bio ? (
          <p className="mt-2.5 text-[0.875rem] leading-relaxed whitespace-pre-wrap text-mist-300">{profile.bio}</p>
        ) : null}

        <div className="mt-4 flex items-center divide-x divide-white/[0.12] text-[0.8125rem]">
          <div className="pr-4">
            <strong className="font-bold tabular-nums text-white">{seriesCount}</strong>{" "}
            <span className="text-mist-400">Series</span>
          </div>
          {summary ? (
            <>
              <button
                type="button"
                onClick={() => setFollowMode("following")}
                className="tap-none px-4 text-mist-400 hover:text-white"
              >
                <strong className="font-bold tabular-nums text-white">{summary.followingCount}</strong>{" "}
                Following
              </button>
              <button
                type="button"
                onClick={() => setFollowMode("followers")}
                className="tap-none pl-4 text-mist-400 hover:text-white"
              >
                <strong className="font-bold tabular-nums text-white">{summary.followersCount}</strong>{" "}
                {pluralize(summary.followersCount, "Follower", "Followers")}
              </button>
            </>
          ) : null}
        </div>

        <div className="no-scrollbar mt-4 flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`tap-none relative shrink-0 py-2.5 text-[0.875rem] font-semibold transition-colors ${
                  active ? "text-white" : "text-mist-500 hover:text-mist-300"
                }`}
              >
                {tab.label}
                {active ? (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-white" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <EditProfileSheet open={editOpen} onClose={() => setEditOpen(false)} />
      <FollowListSheet
        open={followMode !== null}
        onClose={() => setFollowMode(null)}
        username={profile?.username ?? null}
        mode={followMode ?? "followers"}
      />
    </header>
  );
}

function TasteProfileAndStats() {
  const { data, isLoading } = useLibrary();
  const { data: streak } = useWatchStreak();

  if (isLoading) {
    return (
      <section className="mt-5 px-5">
        <Skeleton className="h-44 w-full rounded-[18px]" />
      </section>
    );
  }

  const library = data ?? [];
  const stats = computeLibraryStats(library);
  const insights = computeLibraryInsights(library);
  const topThreeGenres = insights.topGenres.slice(0, 3);
  const maxGenreCount = topThreeGenres[0]?.count ?? 1;
  const watchTimeMinutes = library.reduce(
    (total, item) => total + item.watchedEpisodes * item.episodeRuntime,
    0
  );

  return (
    <section className="mt-5 px-5">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-[1.0625rem] font-bold tracking-[-0.015em] text-white">Taste Profile</h2>
        <div className="flex items-center gap-3">
          {streak && streak > 0 ? (
            <span className="flex items-center gap-1 text-[0.8125rem] font-bold text-[#ff9f0a]" title={`${streak}-day check-in streak`}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                <path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 6 0c0-1 0-2-1-3 2 1 4 4 4 8a8 8 0 0 1-16 0c0-3 2-5 3-7 1 2 2 2 3 1 0-2-1-3-1-5z" />
              </svg>
              {streak}
            </span>
          ) : null}
          <Link
            to="/stats"
            className="tap-none inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-850 px-3 py-1 text-[0.75rem] font-semibold text-mist-200 transition-colors hover:bg-ink-800 hover:text-white active:opacity-70"
          >
            All stats
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="rounded-[18px] border border-white/[0.08] bg-ink-850 p-3.5">
        {topThreeGenres.length > 0 ? (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {topThreeGenres.map((entry, idx) => {
              const pct = Math.min(Math.round((entry.count / Math.max(maxGenreCount, 1)) * 100), 100);
              return (
                <div
                  key={entry.genre}
                  className="min-w-0 rounded-[12px] border border-white/[0.06] bg-ink-900 p-2.5 sm:p-3"
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <GenreSvgIcon index={idx} />
                    <span className="min-w-0 truncate text-[0.75rem] font-semibold text-mist-200">
                      {entry.genre}
                    </span>
                  </div>
                  <p className="mt-2 text-[1.125rem] leading-none font-extrabold tabular-nums text-white">
                    {pct}%
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className={`bar-grow-x h-full rounded-full ${GENRE_BAR_COLORS[idx % GENRE_BAR_COLORS.length]}`}
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="rounded-[12px] border border-white/[0.06] bg-ink-900 px-4 py-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[0.8125rem] font-semibold text-mist-400">Episodes watched</p>
            <p className="text-[1.625rem] leading-none font-extrabold tracking-[-0.03em] tabular-nums text-white">
              {stats.episodesWatched}
            </p>
          </div>
          <div
            className={`mt-3 grid gap-2 border-t border-white/[0.06] pt-3 ${
              watchTimeMinutes > 0 ? "grid-cols-4" : "grid-cols-3"
            }`}
          >
            <InlineStat value={stats.seriesTracked} label="series" />
            <InlineStat value={stats.finished} label="finished" />
            <InlineStat value={stats.averageRating ?? "—"} label="avg rating" />
            {watchTimeMinutes > 0 ? (
              <InlineStat value={<Duration minutes={watchTimeMinutes} />} label="watched" />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewIndicatorBadge() {
  return (
    <span
      className="ios-material absolute right-2 bottom-2 flex size-6 items-center justify-center rounded-[6px] border border-white/15 text-mist-200 shadow-sm shadow-black/50"
      aria-label="Reviewed"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5">
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function FavoriteItemCard({
  item,
  rank,
  organizing,
  hasReview,
  canPinMore,
  pinPending,
  reorderPending,
  onTogglePin,
  onMove,
}: {
  item: SeriesProgress;
  rank: number | null;
  organizing: boolean;
  hasReview: boolean;
  canPinMore: boolean;
  pinPending: boolean;
  reorderPending: boolean;
  onTogglePin: () => void;
  onMove?: (direction: -1 | 1) => void;
}) {
  const toggleFav = useToggleFavorite(item.seriesId);
  const pinned = rank !== null;

  return (
    <div className="relative">
      <Link to={`/series/${item.tmdbId}`} className="tap-none group block active:opacity-75">
        <div className="relative">
          <SeriesPoster path={item.posterPath} alt={item.name} />
          {pinned ? (
            <span className="ios-material absolute top-2 left-2 flex h-5 min-w-5 items-center justify-center rounded-[6px] border border-white/20 px-1.5 text-[0.6875rem] font-extrabold tabular-nums text-white shadow-sm">
              #{rank + 1}
            </span>
          ) : null}
          {item.userRating ? (
            <RatingBadge value={item.userRating} />
          ) : hasReview ? (
            <ReviewIndicatorBadge />
          ) : null}
        </div>
        <p className="mt-2 truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-white">
          {item.name}
        </p>
      </Link>

      {organizing ? (
        <div className="mt-2 flex items-center justify-between gap-1 rounded-[10px] border border-white/10 bg-ink-850 p-1">
          <button
            type="button"
            disabled={pinPending || (!pinned && !canPinMore)}
            aria-pressed={pinned}
            aria-label={pinned ? "Unpin from top 3" : "Pin to top 3"}
            onClick={onTogglePin}
            className={`tap-none flex h-6 flex-1 items-center justify-center gap-1 rounded-[7px] px-1.5 text-[0.6875rem] font-semibold transition-colors disabled:opacity-35 ${
              pinned
                ? "bg-accent-500 text-white"
                : "bg-ink-800 text-mist-300 hover:text-white"
            }`}
          >
            <svg viewBox="0 0 24 24" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="size-3">
              <path d="M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 15v5" strokeLinecap="round" />
            </svg>
            <span>{pinned ? "Top" : "Pin"}</span>
          </button>

          {pinned && onMove ? (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                disabled={reorderPending || rank === 0}
                aria-label="Move left"
                onClick={() => onMove(-1)}
                className="tap-none flex size-6 items-center justify-center rounded-[7px] bg-ink-800 text-mist-300 hover:text-white disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3">
                  <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                disabled={reorderPending}
                aria-label="Move right"
                onClick={() => onMove(1)}
                className="tap-none flex size-6 items-center justify-center rounded-[7px] bg-ink-800 text-mist-300 hover:text-white disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={toggleFav.isPending}
              aria-label={`Remove ${item.name} from favorites`}
              onClick={() => toggleFav.mutate()}
              className="tap-none flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-ink-800 text-mist-400 hover:text-danger-500 disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="size-3">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Favorites() {
  const { data } = useLibrary();
  const { data: ownReviews } = useOwnReviews();
  const setPinned = useSetFavoritePinned();
  const reorder = useReorderFavorites();
  const [organizing, setOrganizing] = useState(false);

  const reviewedSeriesIds = useMemo(() => {
    const ids = new Set<string>();
    for (const review of ownReviews ?? []) {
      if (review.body && review.body.trim().length > 0) {
        ids.add(review.seriesId);
      }
    }
    return ids;
  }, [ownReviews]);

  const favorites = useMemo(() => {
    const list = (data ?? []).filter((item) => item.isFavorite);
    return [...list].sort((a, b) => {
      if (a.favoritePinnedAt && b.favoritePinnedAt) {
        return a.favoritePinnedAt.localeCompare(b.favoritePinnedAt);
      }
      if (a.favoritePinnedAt) return -1;
      if (b.favoritePinnedAt) return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [data]);

  const pinnedList = favorites.filter((item) => item.favoritePinnedAt);
  const pinnedCount = pinnedList.length;
  const pinnedIndex = new Map(pinnedList.map((item, index) => [item.seriesId, index]));

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= pinnedList.length) return;
    const ids = pinnedList.map((item) => item.seriesId);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  }

  if (favorites.length === 0) return null;

  return (
    <section className="mt-7 px-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[1.0625rem] font-bold tracking-[-0.015em] text-white">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 text-accent-500">
            <path d="M12 21.23l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
          </svg>
          <span>Favorites</span>
          <span className="text-[0.875rem] font-normal text-mist-500">{favorites.length}</span>
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOrganizing((current) => !current)}
            className={`tap-none inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.75rem] font-semibold transition-colors ${
              organizing
                ? "bg-accent-500 text-white"
                : "border border-white/10 bg-ink-850 text-mist-200 hover:bg-ink-800 hover:text-white"
            }`}
          >
            {organizing ? "Done" : "Organize"}
          </button>
          {favorites.length > 6 ? (
            <Link
              to="/library?view=favorites"
              className="tap-none inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-850 px-3 py-1 text-[0.75rem] font-semibold text-mist-200 transition-colors hover:bg-ink-800 hover:text-white"
            >
              See all
            </Link>
          ) : null}
        </div>
      </div>

      {organizing ? (
        <p className="mb-3 text-[0.75rem] text-mist-400">
          Pin up to 3 series to showcase at the top of your Favorites and reorder them.
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-6">
        {(organizing ? favorites : favorites.slice(0, 6)).map((item) => {
          const rank = pinnedIndex.has(item.seriesId) ? (pinnedIndex.get(item.seriesId) ?? null) : null;
          return (
            <FavoriteItemCard
              key={item.seriesId}
              item={item}
              rank={rank}
              organizing={organizing}
              hasReview={reviewedSeriesIds.has(item.seriesId)}
              canPinMore={pinnedCount < 3}
              pinPending={setPinned.isPending}
              reorderPending={reorder.isPending}
              onTogglePin={() =>
                setPinned.mutate({ seriesId: item.seriesId, pinned: rank === null })
              }
              onMove={
                rank !== null && pinnedCount > 1
                  ? (direction) => move(rank, direction)
                  : undefined
              }
            />
          );
        })}
      </div>
    </section>
  );
}

function RecentlyWatchedGrid() {
  const { data } = useLibrary();
  const recent = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 6);
  }, [data]);

  if (recent.length === 0) return null;

  return (
    <section className="mt-7 px-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[1.0625rem] font-bold tracking-[-0.015em] text-white">Recently Watched</h2>
        <Link
          to="/library"
          className="tap-none inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-850 px-3 py-1 text-[0.75rem] font-semibold text-mist-200 transition-colors hover:bg-ink-800 hover:text-white active:opacity-70"
        >
          See all
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-6">
        {recent.map((item) => (
          <SeriesCard
            key={item.seriesId}
            tmdbId={item.tmdbId}
            name={item.name}
            posterPath={item.posterPath}
            status={item.status}
            rating={item.userRating}
            progressPercent={item.progressPercent}
          />
        ))}
      </div>
    </section>
  );
}

function OwnReviews() {
  const { user } = useAuth();
  const { data, isLoading } = useOwnReviews();

  return (
    <section className="mt-7 px-5">
      <h2 className="mb-1 flex items-baseline gap-2 text-[1.0625rem] font-bold tracking-[-0.015em] text-white">
        <span>Your Reviews</span>
        {data && data.length > 0 ? <span className="text-[0.875rem] font-normal text-mist-500">{data.length}</span> : null}
      </h2>

      {isLoading ? (
        <div className="flex h-20 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <ReviewList
          reviews={data ?? []}
          currentUserId={user?.id}
          showSeries
          emptyMessage="You have not reviewed anything yet."
        />
      )}
    </section>
  );
}

export function ProfileScreen() {
  const { profile, user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  return (
    <>
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {activeTab === "overview" ? (
        <>
          <TasteProfileAndStats />
          <Favorites />
          <RecentlyWatchedGrid />
          <ListsSection userId={user?.id ?? null} isOwn />
          <DiarySection userId={user?.id ?? null} />
          <OwnReviews />
        </>
      ) : null}

      {activeTab === "watchlist" ? (
        <>
          <Favorites />
          <RecentlyWatchedGrid />
        </>
      ) : null}

      {activeTab === "reviews" ? <OwnReviews /> : null}

      {activeTab === "lists" ? <ListsSection userId={user?.id ?? null} isOwn /> : null}

      {activeTab === "diary" ? <DiarySection userId={user?.id ?? null} /> : null}

      <div className="h-6" />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onDeleteAccount={() => {
          setSettingsOpen(false);
          setDeleteOpen(true);
        }}
      />

      {profile ? (
        <DeleteAccountSheet
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          username={profile.username}
        />
      ) : null}
    </>
  );
}
