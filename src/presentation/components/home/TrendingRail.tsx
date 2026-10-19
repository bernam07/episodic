import { releaseYear } from "@/domain/entities/Series";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
import { useTrending } from "@/presentation/hooks/useDiscovery";
import { useMyLibraryStatus, useMyRatings, useMyWatched } from "@/presentation/hooks/useTracking";
import { useI18n } from "@/presentation/i18n/I18nProvider";

export function TrendingRail() {
  const { t } = useI18n();
  const { data } = useTrending();
  const ratings = useMyRatings();
  const watched = useMyWatched();
  const libraryStatus = useMyLibraryStatus();
  const items = (data?.results ?? []).slice(1, 16);

  if (items.length === 0) return null;

  return (
    <section className="mt-7">
      <h2 className="mb-3 px-5 text-[1.125rem] font-bold tracking-[-0.015em] text-white">
        {t("trendingThisWeek")}
      </h2>
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-5 pb-1">
        {items.map((item) => (
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
