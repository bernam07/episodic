import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { computeLibraryStats } from "@/domain/entities/LibraryStats";
import { ListsSection } from "@/presentation/components/lists/ListsSection";
import { SERIES_STATUS_LABELS, SERIES_STATUSES, type SeriesStatus } from "@/domain/entities/SeriesStatus";
import { queryKeys } from "@/presentation/hooks/queryKeys";
import { container } from "@/presentation/di/container";
import { ReviewList } from "@/presentation/components/reviews/ReviewList";
import { RatingBadge, WatchedBadge } from "@/presentation/components/series/SeriesCard";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { Avatar } from "@/presentation/components/social/Avatar";
import { DeleteAccountSheet } from "@/presentation/components/social/DeleteAccountSheet";
import { DiarySection } from "@/presentation/components/social/DiarySection";
import { EditProfileSheet } from "@/presentation/components/social/EditProfileSheet";
import { FollowListSheet } from "@/presentation/components/social/FollowListSheet";
import { SettingsSheet } from "@/presentation/components/social/SettingsSheet";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useOwnReviews } from "@/presentation/hooks/useReviews";
import { useProfileSummary } from "@/presentation/hooks/useSocial";
import { useLibrary } from "@/presentation/hooks/useTracking";
import { pluralize } from "@/presentation/utils/plural";

const STATUS_DOTS: Record<SeriesStatus, string> = {
  want_to_watch: "bg-sky-400",
  watching: "bg-accent-400",
  watched: "bg-emerald-400",
  abandoned: "bg-mist-500",
};

function SecondaryStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="px-2 py-1 text-center">
      <p className="text-[19px] leading-none font-bold tabular-nums text-mist-100">{value}</p>
      <p className="mt-1 text-[10px] tracking-wide text-mist-500 uppercase">{label}</p>
    </div>
  );
}

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
      <div className="flex h-24 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const library = data ?? [];
  const stats = computeLibraryStats(library);

  return (
    <section className="px-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-600/25 via-ink-850 to-ink-850 p-5 ring-1 ring-white/5 ring-inset">
        <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-accent-500/10 blur-2xl" />
        <p className="text-[12px] font-medium tracking-wide text-mist-400 uppercase">Episodes watched</p>
        <p className="mt-1 text-[44px] leading-none font-bold tabular-nums text-mist-100">
          {stats.episodesWatched}
        </p>

        <div className="mt-5 grid grid-cols-3 divide-x divide-white/5 rounded-xl bg-ink-950/40 py-3">
          <SecondaryStat value={stats.seriesTracked} label="Series" />
          <SecondaryStat value={stats.finished} label="Finished" />
          <SecondaryStat value={stats.averageRating ?? "—"} label="Avg ★" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
              {library.filter((item) => item.status === status).length}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function formatWatchTime(minutes: number): { value: string; unit: string } {
  if (minutes < 60) return { value: String(minutes), unit: "minutes" };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { value: String(hours), unit: "hours" };
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return { value: `${days}d ${remainHours}h`, unit: "watch time" };
}

function WatchTime() {
  const { data: library } = useLibrary();

  const watchedSeries = useMemo(
    () => (library ?? []).filter((item) => item.watchedEpisodes > 0),
    [library]
  );

  const detailQueries = useQueries({
    queries: watchedSeries.map((item) => ({
      queryKey: queryKeys.seriesDetail(item.tmdbId),
      queryFn: () => container.usecases.getSeriesDetail.execute(item.tmdbId),
      staleTime: 1000 * 60 * 60 * 12,
    })),
  });

  const allLoaded = detailQueries.every((q) => q.data || q.error);
  const totalMinutes = useMemo(() => {
    if (!allLoaded) return 0;
    let total = 0;
    for (let i = 0; i < watchedSeries.length; i++) {
      const detail = detailQueries[i]?.data;
      if (!detail) continue;
      const runtimes = detail.episodeRunTime ?? [];
      const avgRuntime = runtimes.length > 0
        ? runtimes.reduce((a, b) => a + b, 0) / runtimes.length
        : 0;
      if (avgRuntime > 0) {
        total += watchedSeries[i].watchedEpisodes * avgRuntime;
      }
    }
    return Math.round(total);
  }, [allLoaded, watchedSeries, detailQueries]);

  if (watchedSeries.length === 0 || !allLoaded || totalMinutes === 0) return null;

  const formatted = formatWatchTime(totalMinutes);

  return (
    <section className="mt-4 px-5">
      <div className="flex items-center gap-3 rounded-xl bg-ink-850 px-4 py-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5 shrink-0 text-accent-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="text-[18px] font-bold leading-none tabular-nums text-mist-100">{formatted.value}</p>
          <p className="mt-0.5 text-[11px] tracking-wide text-mist-500 uppercase">{formatted.unit}</p>
        </div>
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
      <WatchTime />
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
