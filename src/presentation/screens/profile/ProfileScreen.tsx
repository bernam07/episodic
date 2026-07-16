import { Link } from "react-router-dom";
import { SERIES_STATUS_LABELS, SERIES_STATUSES } from "@/domain/entities/SeriesStatus";
import { ReviewList } from "@/presentation/components/reviews/ReviewList";
import { Avatar } from "@/presentation/components/social/Avatar";
import { Button } from "@/presentation/components/ui/Button";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useOwnReviews } from "@/presentation/hooks/useReviews";
import { useProfileSummary } from "@/presentation/hooks/useSocial";
import { useLibrary } from "@/presentation/hooks/useTracking";

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
      </div>

      {summary ? (
        <div className="mt-4 flex gap-5">
          <span className="text-[13px] text-mist-400">
            <strong className="font-bold text-mist-100">{summary.followersCount}</strong> followers
          </span>
          <span className="text-[13px] text-mist-400">
            <strong className="font-bold text-mist-100">{summary.followingCount}</strong> following
          </span>
        </div>
      ) : null}
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
  const episodes = library.reduce((sum, item) => sum + item.watchedEpisodes, 0);
  const rated = library.filter((item) => item.userRating !== null);
  const averageRating =
    rated.length > 0
      ? (rated.reduce((sum, item) => sum + (item.userRating ?? 0), 0) / rated.length).toFixed(1)
      : "—";

  return (
    <section className="px-5">
      <div className="grid grid-cols-3 gap-3">
        <StatTile value={episodes} label="episodes watched" />
        <StatTile value={library.length} label="series tracked" />
        <StatTile value={averageRating} label="average rating" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SERIES_STATUSES.map((status) => (
          <Link key={status} to="/library" className="tap-none active:opacity-70">
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
  const { signOut } = useAuth();

  return (
    <>
      <Header />
      <Stats />
      <OwnReviews />

      <div className="mt-10 px-5">
        <Button variant="danger" fullWidth onClick={() => void signOut()}>
          Sign Out
        </Button>
      </div>
    </>
  );
}
