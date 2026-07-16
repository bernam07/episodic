import { SERIES_STATUS_LABELS, SERIES_STATUSES } from "@/domain/entities/SeriesStatus";
import { Button } from "@/presentation/components/ui/Button";
import { RatingDisplay } from "@/presentation/components/ui/Rating";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useOwnReviews } from "@/presentation/hooks/useReviews";
import { useLibrary } from "@/presentation/hooks/useTracking";
import { ScreenHeader } from "@/presentation/layout/ScreenHeader";

function StatsGrid() {
  const { data } = useLibrary();

  const counts = SERIES_STATUSES.map((status) => ({
    status,
    count: (data ?? []).filter((item) => item.status === status).length,
  }));

  const episodes = (data ?? []).reduce((sum, item) => sum + item.watchedEpisodes, 0);

  return (
    <div className="px-5">
      <div className="rounded-card bg-ink-850 p-4">
        <p className="text-[32px] leading-none font-bold tabular-nums text-mist-100">{episodes}</p>
        <p className="mt-1 text-[12px] text-mist-400">episodes watched</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {counts.map(({ status, count }) => (
          <div key={status} className="rounded-card bg-ink-850 p-4">
            <p className="text-[22px] leading-none font-bold tabular-nums text-mist-100">{count}</p>
            <p className="mt-1 text-[11px] text-mist-400">{SERIES_STATUS_LABELS[status]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnReviews() {
  const { data } = useOwnReviews();

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 px-5">
      <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        Your Reviews
      </h2>
      <ul className="divide-y divide-ink-800">
        {data.map((review) => (
          <li key={review.id} className="flex items-start justify-between gap-3 py-3">
            <p className="min-w-0 flex-1 truncate text-[14px] text-mist-200">
              {review.body || "No written review"}
            </p>
            <RatingDisplay value={review.rating} className="shrink-0" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProfileScreen() {
  const { profile, user, signOut } = useAuth();

  return (
    <>
      <ScreenHeader
        title={profile?.displayName || profile?.username || "Profile"}
        subtitle={user?.email ?? undefined}
      />
      <StatsGrid />
      <OwnReviews />

      <div className="mt-10 px-5">
        <Button variant="danger" fullWidth onClick={() => void signOut()}>
          Sign Out
        </Button>
      </div>
    </>
  );
}
