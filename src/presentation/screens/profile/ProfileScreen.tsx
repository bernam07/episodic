import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { computeLibraryStats } from "@/domain/entities/LibraryStats";
import { ListsSection } from "@/presentation/components/lists/ListsSection";
import { ReviewList } from "@/presentation/components/reviews/ReviewList";
import { RatingBadge, WatchedBadge } from "@/presentation/components/series/SeriesCard";
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
  useWatchStreak,
} from "@/presentation/hooks/useTracking";
import { pluralize } from "@/presentation/utils/plural";

function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { profile, user } = useAuth();
  const { data: summary } = useProfileSummary(profile?.username ?? null);
  const [editOpen, setEditOpen] = useState(false);
  const [followMode, setFollowMode] = useState<"followers" | "following" | null>(null);

  return (
    <header className="px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-5">
      <div className="flex items-center gap-4">
        <Avatar
          username={profile?.username ?? "?"}
          displayName={profile?.displayName}
          avatarUrl={profile?.avatarUrl}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[1.375rem] font-bold tracking-[-0.02em] text-white">
            {profile?.displayName || profile?.username || "Profile"}
          </h1>
          {profile ? <p className="truncate text-[0.8125rem] text-mist-500">@{profile.username}</p> : null}
          <p className="mt-0.5 truncate text-[0.75rem] text-mist-500">{user?.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label="Edit profile"
            className="tap-none flex size-9 items-center justify-center rounded-full bg-ink-850 text-accent-500 transition-opacity active:opacity-70 hover:bg-ink-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]">
              <path
                d="M4 20l4.3-.9L19.6 7.8a1.5 1.5 0 0 0 0-2.1l-1.3-1.3a1.5 1.5 0 0 0-2.1 0L4.9 15.7z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M14.5 6.5l3 3" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="tap-none flex size-9 items-center justify-center rounded-full bg-ink-850 text-accent-500 transition-opacity active:opacity-70 hover:bg-ink-800"
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

      {profile?.bio ? <p className="mt-3 text-[0.9375rem] whitespace-pre-wrap text-mist-300">{profile.bio}</p> : null}

      {summary ? (
        <div className="mt-4 flex gap-5">
          <button type="button" onClick={() => setFollowMode("followers")} className="tap-none text-[0.8125rem] text-mist-500">
            <strong className="font-semibold text-white">{summary.followersCount}</strong>{" "}
            {pluralize(summary.followersCount, "follower")}
          </button>
          <button type="button" onClick={() => setFollowMode("following")} className="tap-none text-[0.8125rem] text-mist-500">
            <strong className="font-semibold text-white">{summary.followingCount}</strong> following
          </button>
        </div>
      ) : null}

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

function Stats() {
  const { data, isLoading } = useLibrary();
  const { data: streak } = useWatchStreak();

  if (isLoading) {
    return (
      <section className="px-5">
        <Skeleton className="h-42 w-full rounded-[20px]" />
      </section>
    );
  }

  const library = data ?? [];
  const stats = computeLibraryStats(library);
  const watchTimeMinutes = library.reduce(
    (total, item) => total + item.watchedEpisodes * item.episodeRuntime,
    0
  );

  return (
    <section className="px-5">
      <div className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-ink-850 px-6 pt-5 pb-5">
        <div className="relative flex items-baseline justify-between gap-3">
          <p className="text-[0.8125rem] font-semibold text-mist-500">
            Episodes watched
          </p>
          <div className="flex shrink-0 items-center gap-3">
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
              className="tap-none flex shrink-0 items-center gap-1 text-[0.875rem] font-normal text-accent-500 active:opacity-70"
            >
              All stats
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>

        <p className="relative mt-2 text-[2.75rem] leading-none font-bold tracking-[-0.03em] tabular-nums text-white">
          {stats.episodesWatched}
        </p>

        <div className="relative mt-5 flex gap-2 border-t border-white/[0.08] pt-4">
          <InlineStat value={stats.seriesTracked} label="series" />
          <InlineStat value={stats.finished} label="finished" />
          <InlineStat value={stats.averageRating ?? "—"} label="avg rating" />
          {watchTimeMinutes > 0 ? (
            <InlineStat value={<Duration minutes={watchTimeMinutes} />} label="watched" />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Favorites() {
  const { data } = useLibrary();
  const setPinned = useSetFavoritePinned();

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

  const reorder = useReorderFavorites();
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
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between px-5">
        <h2 className="flex items-center gap-1.5 text-[1.1875rem] font-bold tracking-[-0.015em] text-white">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 text-danger-500">
            <path d="M12 21.23l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
          </svg>
          <span>Favorites</span>
          <span className="text-[0.875rem] font-normal text-mist-500">{favorites.length}</span>
        </h2>
        {favorites.length > 1 ? (
          <span className="text-[0.75rem] text-mist-500">Pin up to 3 to feature</span>
        ) : null}
      </div>
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-5 pb-1">
        {favorites.map((item) => {
          const pinned = item.favoritePinnedAt !== null;
          const disabled = setPinned.isPending || (!pinned && pinnedCount >= 3);
          return (
            <div key={item.seriesId} className="relative w-[116px] shrink-0">
              <Link to={`/series/${item.tmdbId}`} className="tap-none block active:opacity-75">
                <div className="relative">
                  <SeriesPoster path={item.posterPath} alt={item.name} />
                  {item.userRating ? (
                    <RatingBadge value={item.userRating} />
                  ) : item.status === "watched" ? (
                    <WatchedBadge />
                  ) : null}
                </div>
                <p className="mt-2 truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-white">{item.name}</p>
              </Link>
              <button
                type="button"
                disabled={disabled}
                aria-pressed={pinned}
                aria-label={pinned ? "Unpin from featured" : "Pin to featured"}
                onClick={() => setPinned.mutate({ seriesId: item.seriesId, pinned: !pinned })}
                className={`tap-none absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full backdrop-blur-md transition-colors disabled:opacity-40 ${
                  pinned
                    ? "bg-accent-500 text-white"
                    : "bg-black/65 text-mist-300 active:bg-ink-850"
                }`}
              >
                <svg viewBox="0 0 24 24" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="size-3.5">
                  <path d="M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 15v5" strokeLinecap="round" />
                </svg>
              </button>
              {pinned && pinnedCount > 1 ? (
                <div className="mt-1 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={reorder.isPending || (pinnedIndex.get(item.seriesId) ?? 0) === 0}
                    aria-label="Move left"
                    onClick={() => move(pinnedIndex.get(item.seriesId) ?? 0, -1)}
                    className="tap-none flex size-6 items-center justify-center rounded-full bg-ink-800 text-mist-300 active:bg-ink-700 disabled:opacity-30"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3">
                      <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={reorder.isPending || (pinnedIndex.get(item.seriesId) ?? 0) === pinnedCount - 1}
                    aria-label="Move right"
                    onClick={() => move(pinnedIndex.get(item.seriesId) ?? 0, 1)}
                    className="tap-none flex size-6 items-center justify-center rounded-full bg-ink-800 text-mist-300 active:bg-ink-700 disabled:opacity-30"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function OwnReviews() {
  const { user } = useAuth();
  const { data, isLoading } = useOwnReviews();

  return (
    <section className="mt-8 px-5">
      <h2 className="mb-1 flex items-baseline gap-2 text-[1.1875rem] font-bold tracking-[-0.015em] text-white">
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

  return (
    <>
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <Stats />
      <Favorites />
      <ListsSection userId={user?.id ?? null} isOwn />
      <DiarySection userId={user?.id ?? null} />
      <OwnReviews />

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
