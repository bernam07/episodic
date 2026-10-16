import { Link } from "react-router-dom";
import { releaseYear } from "@/domain/entities/Series";
import { InLibraryBadge, RatingBadge, WatchedBadge } from "@/presentation/components/series/SeriesCard";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { useRecommendations } from "@/presentation/hooks/useDiscovery";
import { useMyLibraryStatus, useMyRatings, useMyWatched } from "@/presentation/hooks/useTracking";

export function MoreLikeThisRail({ tmdbId }: { tmdbId: number }) {
  const { data } = useRecommendations(tmdbId);
  const ratings = useMyRatings();
  const watched = useMyWatched();
  const libraryStatus = useMyLibraryStatus();

  const items = (data?.results ?? []).filter((item) => item.tmdbId !== tmdbId).slice(0, 12);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-7">
      <h2 className="mb-3 px-5 text-[1.1875rem] font-bold tracking-[-0.015em] text-white">
        More Like This
      </h2>
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-5 pb-1">
        {items.map((item) => {
          const rating = ratings.get(item.tmdbId) ?? null;
          return (
            <Link
              key={item.tmdbId}
              to={`/series/${item.tmdbId}`}
              className="tap-none w-[116px] shrink-0 active:opacity-75"
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
              <p className="mt-2 truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-white">{item.name}</p>
              {item.firstAirDate ? (
                <p className="mt-0.5 text-[0.75rem] text-mist-500">{releaseYear(item)}</p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
