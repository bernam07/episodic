import { useMemo, useState } from "react";
import { releaseYear } from "@/domain/entities/Series";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
import { useRecommendations } from "@/presentation/hooks/useDiscovery";
import {
  useLibrary,
  useMyLibraryStatus,
  useMyRatings,
  useMyWatched,
} from "@/presentation/hooks/useTracking";

export function RecommendationsRail() {
  const { data: library } = useLibrary();
  const ratings = useMyRatings();
  const watched = useMyWatched();
  const libraryStatus = useMyLibraryStatus();

  const [seedIndex] = useState(() => Math.random());
  const seed = useMemo(() => {
    if (!library || library.length === 0) return null;
    const topRated = library
      .filter((item) => item.userRating !== null)
      .sort((a, b) => (b.userRating ?? 0) - (a.userRating ?? 0))
      .slice(0, 5);
    const active = library.filter((item) => item.status === "watching" || item.status === "watched");
    const pool = topRated.length > 0 ? topRated : active.length > 0 ? active : library;
    return pool[Math.floor(seedIndex * pool.length)];
  }, [library, seedIndex]);

  const { data: recs } = useRecommendations(seed?.tmdbId ?? null);

  const inLibrary = useMemo(() => new Set((library ?? []).map((item) => item.tmdbId)), [library]);
  const suggestions = useMemo(
    () => (recs?.results ?? []).filter((item) => !inLibrary.has(item.tmdbId)).slice(0, 15),
    [recs, inLibrary]
  );

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="mt-7">
      <h2 className="mb-3 truncate px-5 text-[1.125rem] font-bold tracking-[-0.015em] text-white">
        {seed ? `Because you watched ${seed.name}` : "Recommended for You"}
      </h2>
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-5 pb-1">
        {suggestions.map((item) => (
          <div key={item.tmdbId} className="w-[132px] shrink-0">
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
