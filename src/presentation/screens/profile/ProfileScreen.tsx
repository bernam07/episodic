import { useState } from "react";
import { Link } from "react-router-dom";
import { computeLibraryStats } from "@/domain/entities/LibraryStats";
import { ListsSection } from "@/presentation/components/lists/ListsSection";
import { SERIES_STATUS_LABELS, SERIES_STATUSES, type SeriesStatus } from "@/domain/entities/SeriesStatus";
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
import { useLibrary } from "@/presentation/hooks/useTracking";
import { pluralize } from "@/presentation/utils/plural";

const STATUS_DOTS: Record<SeriesStatus, string> = {
  want_to_watch: "bg-[#d97706]",
  watching: "bg-[#3b82f6]",
  watched: "bg-[#059669]",
  abandoned: "bg-[#f43f5e]",
};

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
          <h1 className="truncate text-[22px] font-bold tracking-tight text-mist-100">
            {profile?.displayName || profile?.username || "Profile"}
          </h1>
          {profile ? <p className="truncate text-[13px] text-mist-500">@{profile.username}</p> : null}
          <p className="mt-0.5 truncate text-[12px] text-mist-500">{user?.email}</p>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label="Edit profile"
            className="tap-none flex size-10 items-center justify-center rounded-full text-mist-300 active:bg-ink-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
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
            className="tap-none flex size-10 items-center justify-center rounded-full text-mist-300 active:bg-ink-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
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

      {profile?.bio ? <p className="mt-3 text-[14px] whitespace-pre-wrap text-mist-300">{profile.bio}</p> : null}

      {summary ? (
        <div className="mt-4 flex gap-5">
          <button type="button" onClick={() => setFollowMode("followers")} className="tap-none text-[13px] text-mist-400">
            <strong className="font-bold text-mist-100">{summary.followersCount}</strong>{" "}
            {pluralize(summary.followersCount, "follower")}
          </button>
          <button type="button" onClick={() => setFollowMode("following")} className="tap-none text-[13px] text-mist-400">
            <strong className="font-bold text-mist-100">{summary.followingCount}</strong> following
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

  if (isLoading) {
    return (
      <section className="px-5">
        <Skeleton className="h-42 w-full rounded-3xl" />
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
      <div className="relative overflow-hidden rounded-3xl bg-ink-850 px-6 pt-6 pb-5">
        <div className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full bg-accent-500/18 blur-3xl" />

        <div className="relative flex items-baseline justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-accent-300 uppercase">
            Episodes watched
          </p>
          <Link
            to="/stats"
            className="tap-none flex shrink-0 items-center gap-1 text-[12px] font-semibold text-accent-400 active:text-accent-300"
          >
            All stats
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <p className="relative mt-2.5 text-[48px] leading-none font-bold tracking-tight text-mist-100">
          {stats.episodesWatched}
        </p>

        <div className="relative mt-6 flex gap-2 border-t border-white/8 pt-4">
          <InlineStat value={stats.seriesTracked} label="series" />
          <InlineStat value={stats.finished} label="finished" />
          <InlineStat value={stats.averageRating ?? "—"} label="avg rating" />
          {watchTimeMinutes > 0 ? (
            <InlineStat value={<Duration minutes={watchTimeMinutes} />} label="watched" />
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3.5 px-1 sm:grid-cols-4">
        {SERIES_STATUSES.map((status) => (
          <Link
            key={status}
            to={`/library?status=${status}`}
            className="tap-none flex items-center gap-2.5 active:opacity-70"
          >
            <span className={`size-2 shrink-0 rounded-full ${STATUS_DOTS[status]}`} />
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] leading-none font-bold text-mist-100">
                {library.filter((item) => item.status === status).length}
              </span>
              <span className="mt-1 block truncate text-[11px] text-mist-500">
                {SERIES_STATUS_LABELS[status]}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Favorites() {
  const { data } = useLibrary();
  const favorites = (data ?? []).filter((item) => item.isFavorite);

  if (favorites.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-1.5 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5 text-rose-400">
          <path d="M12 21.23l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
        </svg>
        Favorites
        <span className="text-mist-600">{favorites.length}</span>
      </h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {favorites.map((item) => (
          <Link
            key={item.seriesId}
            to={`/series/${item.tmdbId}`}
            className="tap-none w-[116px] shrink-0 active:opacity-70"
          >
            <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10">
              <SeriesPoster path={item.posterPath} alt={item.name} />
              {item.userRating ? (
                <RatingBadge value={item.userRating} />
              ) : item.status === "watched" ? (
                <WatchedBadge />
              ) : null}
            </div>
            <p className="mt-2 truncate text-[13px] font-semibold text-mist-100">{item.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function OwnReviews() {
  const { user } = useAuth();
  const { data, isLoading } = useOwnReviews();

  return (
    <section className="mt-8 px-5">
      <h2 className="mb-1 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        Your Reviews
        {data && data.length > 0 ? <span className="ml-1.5 text-mist-600">{data.length}</span> : null}
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
