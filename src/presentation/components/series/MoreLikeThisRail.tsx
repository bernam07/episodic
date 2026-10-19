import { releaseYear } from "@/domain/entities/Series";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
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
      <h2 className="mb-3 px-5 text-[1.125rem] font-bold tracking-[-0.015em] text-white">
        More Like This
      </h2>
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-5 pb-1">
        {items.map((item) => (
          <div key={item.tmdbId} className="w-[116px] shrink-0">
            <SeriesCard
              tmdbId={item.tmdbId}
              name={item.name}
              posterPath={item.posterPath}
              year={releaseYear(item)}
              rating={ratings.get(item.tmdbId) ?? (item.voteAverage && item.voteAverage > 0 ? item.voteAverage : null)}
              watched={watched.has(item.tmdbId)}
              libraryStatus={libraryStatus.get(item.tmdbId) ?? null}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
