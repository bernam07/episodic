import { Link } from "react-router-dom";
import { posterUrl } from "@/data/tmdb/images";
import type { FeedItem } from "@/domain/entities/Social";
import { StatusBadge } from "@/presentation/components/series/StatusBadge";
import { Avatar } from "@/presentation/components/social/Avatar";
import { RatingDisplay } from "@/presentation/components/ui/Rating";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useFollowingFeed } from "@/presentation/hooks/useSocial";
import { ScreenHeader } from "@/presentation/layout/ScreenHeader";
import { plural } from "@/presentation/utils/plural";

function relativeTime(value: string): string {
  const then = new Date(value).getTime();

  if (Number.isNaN(then)) {
    return "";
  }

  const seconds = Math.max(Math.floor((Date.now() - then) / 1000), 0);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function verb(item: FeedItem): string {
  switch (item.status) {
    case "want_to_watch":
      return "wants to watch";
    case "watching":
      return "is watching";
    case "watched":
      return "finished";
    case "abandoned":
      return "abandoned";
  }
}

function FeedRow({ item }: { item: FeedItem }) {
  const poster = posterUrl(item.posterPath, "w154");

  return (
    <li className="flex gap-3 py-4">
      <Link to={`/user/${item.username}`} className="tap-none shrink-0">
        <Avatar
          username={item.username}
          displayName={item.displayName}
          avatarUrl={item.avatarUrl}
        />
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-mist-300">
          <Link to={`/user/${item.username}`} className="font-semibold text-mist-100">
            {item.displayName || item.username}
          </Link>{" "}
          {verb(item)}{" "}
          <Link to={`/series/${item.tmdbId}`} className="font-semibold text-accent-400">
            {item.seriesName}
          </Link>
        </p>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[11px] text-mist-500">{relativeTime(item.updatedAt)}</span>
          {item.rating !== null ? <RatingDisplay value={item.rating} /> : null}
        </div>
      </div>

      <Link to={`/series/${item.tmdbId}`} className="tap-none relative shrink-0 active:opacity-70">
        <div className="h-[72px] w-12 overflow-hidden rounded-lg bg-ink-800">
          {poster ? <img src={poster} alt="" loading="lazy" className="size-full object-cover" /> : null}
        </div>
        <StatusBadge status={item.status} className="absolute -bottom-1 left-1/2 -translate-x-1/2 scale-90" />
      </Link>
    </li>
  );
}

function FeedFooter({ count }: { count: number }) {
  return (
    <p className="px-5 py-8 text-center text-[12px] text-mist-500">
      Recent activity from {plural(count, "person", "people")} you follow.
    </p>
  );
}

export function FriendsScreen() {
  const { data, isLoading } = useFollowingFeed();

  return (
    <>
      <ScreenHeader
        title="Friends"
        subtitle={data && data.length > 0 ? "What the people you follow are watching" : undefined}
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : null}

      {!isLoading && (!data || data.length === 0) ? (
        <div className="px-5 pt-10 text-center">
          <p className="text-[15px] font-semibold text-mist-200">No activity yet</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-mist-500">
            Follow people to see the series they add, rate and finish.
          </p>
          <Link
            to="/search"
            className="tap-none mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-accent-600 px-5 text-[14px] font-semibold text-white active:bg-accent-500"
          >
            Find people
          </Link>
        </div>
      ) : null}

      {data && data.length > 0 ? (
        <ul className="divide-y divide-ink-800 px-5">
          {data.map((item) => (
            <FeedRow key={`${item.userId}-${item.seriesId}`} item={item} />
          ))}
        </ul>
      ) : null}

      {data && data.length > 0 ? <FeedFooter count={new Set(data.map((item) => item.userId)).size} /> : null}
    </>
  );
}
