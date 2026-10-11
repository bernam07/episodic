import { Link } from "react-router-dom";
import { releaseYear } from "@/domain/entities/Series";
import { InLibraryBadge, RatingBadge, WatchedBadge } from "@/presentation/components/series/SeriesCard";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
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
      <h2 className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        {t("trendingThisWeek")}
      </h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {items.map((item) => {
          const rating = ratings.get(item.tmdbId) ?? null;
          return (
            <Link
              key={item.tmdbId}
              to={`/series/${item.tmdbId}`}
              className="tap-none w-[132px] shrink-0 active:opacity-70"
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
              <p className="mt-2 truncate text-[13px] font-semibold text-mist-100">{item.name}</p>
              {item.firstAirDate ? (
                <p className="mt-0.5 text-[11px] text-mist-400">{releaseYear(item)}</p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
