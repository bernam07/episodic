import { useState } from "react";
import { Link } from "react-router-dom";
import { computeLibraryStats } from "@/domain/entities/LibraryStats";
import { SERIES_STATUS_LABELS, SERIES_STATUSES } from "@/domain/entities/SeriesStatus";
import { ReviewList } from "@/presentation/components/reviews/ReviewList";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
import { Avatar } from "@/presentation/components/social/Avatar";
import { DeleteAccountSheet } from "@/presentation/components/social/DeleteAccountSheet";
import { DiarySection } from "@/presentation/components/social/DiarySection";
import { EditProfileSheet } from "@/presentation/components/social/EditProfileSheet";
import { FollowListSheet } from "@/presentation/components/social/FollowListSheet";
import { Button } from "@/presentation/components/ui/Button";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useOwnReviews } from "@/presentation/hooks/useReviews";
import { useProfileSummary } from "@/presentation/hooks/useSocial";
import { useLibrary } from "@/presentation/hooks/useTracking";
import { pluralize } from "@/presentation/utils/plural";

function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-card bg-ink-850 px-3 py-3.5 text-center">
      <p className="text-[20px] leading-none font-bold tabular-nums text-mist-100">{value}</p>
      <p className="mt-1 text-[11px] text-mist-500">{label}</p>
    </div>
  );
}

function Header() {
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
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label="Edit profile"
          className="tap-none flex size-10 shrink-0 items-center justify-center rounded-full text-mist-300 active:bg-ink-800"
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile value={stats.episodesWatched} label="episodes watched" />
        <StatTile value={stats.seriesTracked} label="series tracked" />
        <StatTile value={stats.averageRating ?? "—"} label="average rating" />
        <StatTile value={stats.favorites} label="favorites" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SERIES_STATUSES.map((status) => (
          <Link key={status} to={`/library?status=${status}`} className="tap-none active:opacity-70">
            <StatTile
              value={library.filter((item) => item.status === status).length}
              label={SERIES_STATUS_LABELS[status]}
            />
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
    <section className="mt-7 px-5">
      <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        Favorites
        <span className="ml-1.5 text-mist-600">{favorites.length}</span>
      </h2>
      <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5">
        {favorites.map((item) => (
          <SeriesCard
            key={item.seriesId}
            tmdbId={item.tmdbId}
            name={item.name}
            posterPath={item.posterPath}
            status={item.status}
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
  const { signOut, profile, user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Header />
      <Stats />
      <Favorites />
      <DiarySection userId={user?.id ?? null} />
      <OwnReviews />

      <div className="mt-10 px-5">
        <Button variant="secondary" fullWidth onClick={() => void signOut()}>
          Sign Out
        </Button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="tap-none mt-3 min-h-[44px] w-full text-[13px] font-medium text-mist-500 active:text-danger-500"
        >
          Delete account
        </button>
      </div>

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
