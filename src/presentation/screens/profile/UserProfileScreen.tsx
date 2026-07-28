import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ComparisonSheet } from "@/presentation/components/social/ComparisonSheet";
import { SERIES_STATUS_LABELS, SERIES_STATUSES } from "@/domain/entities/SeriesStatus";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
import { Avatar } from "@/presentation/components/social/Avatar";
import { ListsSection } from "@/presentation/components/lists/ListsSection";
import { DiarySection } from "@/presentation/components/social/DiarySection";
import { FollowButton } from "@/presentation/components/social/FollowButton";
import { FollowListSheet } from "@/presentation/components/social/FollowListSheet";
import { FullScreenSpinner, Spinner } from "@/presentation/components/ui/Spinner";
import { useProfileSummary, useUserFavorites, useUserLibrary } from "@/presentation/hooks/useSocial";
import { pluralize } from "@/presentation/utils/plural";

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-card bg-ink-850 px-3 py-3 text-center">
      <p className="text-[18px] leading-none font-bold tabular-nums text-mist-100">{value}</p>
      <p className="mt-1 text-[11px] text-mist-500">{label}</p>
    </div>
  );
}

export function UserProfileScreen() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { data: summary, isLoading } = useProfileSummary(username ?? null);
  const { data: library, isLoading: libraryLoading } = useUserLibrary(
    summary && !summary.isSelf ? summary.id : null
  );
  const { data: favorites } = useUserFavorites(
    summary && !summary.isSelf && summary.isFollowing ? summary.id : null
  );
  const [followMode, setFollowMode] = useState<"followers" | "following" | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  if (isLoading) {
    return <FullScreenSpinner />;
  }

  if (!summary) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+3rem)] text-center">
        <p className="text-[15px] font-semibold text-mist-200">User not found</p>
        <p className="mt-1 text-[13px] text-mist-500">No one here goes by “{username}”.</p>
        <Link
          to="/search"
          className="tap-none mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-ink-800 px-5 text-[14px] font-semibold text-mist-200 active:bg-ink-700"
        >
          Back to search
        </Link>
      </div>
    );
  }

  if (summary.isSelf) {
    return <Navigate to="/profile" replace />;
  }

  const counts = SERIES_STATUSES.map((status) => ({
    status,
    count: (library ?? []).filter((item) => item.status === status).length,
  }));

  return (
    <>
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
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
      </div>

      <header className="px-5 pt-2 pb-5">
        <div className="flex items-center gap-4">
          <Avatar
            username={summary.username}
            displayName={summary.displayName}
            avatarUrl={summary.avatarUrl}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-bold tracking-tight text-mist-100">
              {summary.displayName || summary.username}
            </h1>
            <p className="truncate text-[13px] text-mist-500">@{summary.username}</p>
            <div className="mt-2 flex gap-4">
              <button
                type="button"
                onClick={() => setFollowMode("followers")}
                className="tap-none text-[12px] text-mist-400"
              >
                <strong className="font-bold text-mist-100">{summary.followersCount}</strong>{" "}
                {pluralize(summary.followersCount, "follower")}
              </button>
              <button
                type="button"
                onClick={() => setFollowMode("following")}
                className="tap-none text-[12px] text-mist-400"
              >
                <strong className="font-bold text-mist-100">{summary.followingCount}</strong> following
              </button>
            </div>
          </div>
        </div>

        {summary.bio ? (
          <p className="mt-3 text-[14px] whitespace-pre-wrap text-mist-300">{summary.bio}</p>
        ) : null}

        <div className="mt-4 flex gap-3">
          <FollowButton userId={summary.id} isFollowing={summary.isFollowing} size="md" />
          {summary.isFollowing ? (
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              className="tap-none flex min-h-[40px] items-center gap-2 rounded-xl bg-ink-800 px-4 text-[13px] font-semibold text-mist-300 active:bg-ink-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                <path d="M16 3h5v5M8 3H3v5M21 3l-7 7M3 3l7 7M16 21h5v-5M8 21H3v-5M21 21l-7-7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Compare
            </button>
          ) : null}
        </div>

        <FollowListSheet
          open={followMode !== null}
          onClose={() => setFollowMode(null)}
          username={summary.username}
          mode={followMode ?? "followers"}
        />
      </header>

      <section className="px-5">
        <div className="grid grid-cols-3 gap-3">
          <StatTile value={summary.seriesCount} label="series" />
          <StatTile value={summary.episodesWatched} label="episodes" />
          <StatTile value={summary.reviewsCount} label="reviews" />
        </div>
      </section>

      <ListsSection userId={summary.id} isOwn={false} />

      {!summary.isFollowing ? (
        <div className="mx-5 mt-6 rounded-card border border-ink-700 bg-ink-850 p-5 text-center">
          <p className="text-[14px] font-semibold text-mist-200">This library is private</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-mist-500">
            Follow {summary.displayName || summary.username} to see the series they are watching.
          </p>
        </div>
      ) : (
        <>
          {favorites && favorites.length > 0 ? (
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
                    name={item.seriesName}
                    posterPath={item.posterPath}
                    status={item.status}
                    rating={item.rating}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between px-5">
              <h2 className="text-[13px] font-semibold tracking-wide text-mist-400 uppercase">Library</h2>
              <span className="text-[11px] text-mist-500">
                {counts
                  .filter((entry) => entry.count > 0)
                  .map((entry) => `${entry.count} ${SERIES_STATUS_LABELS[entry.status].toLowerCase()}`)
                  .join(" · ")}
              </span>
            </div>

            {libraryLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner />
              </div>
            ) : (library?.length ?? 0) === 0 ? (
              <p className="px-5 pt-4 text-center text-[14px] text-mist-500">
                Nothing in their library yet.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {(library ?? []).map((item) => (
                  <SeriesCard
                    key={item.seriesId}
                    tmdbId={item.tmdbId}
                    name={item.seriesName}
                    posterPath={item.posterPath}
                    status={item.status}
                    rating={item.rating}
                  />
                ))}
              </div>
            )}
          </section>

          <DiarySection userId={summary.id} />
        </>
      )}

      <ComparisonSheet
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        userId={summary.id}
        displayName={summary.displayName || summary.username}
      />
    </>
  );
}
