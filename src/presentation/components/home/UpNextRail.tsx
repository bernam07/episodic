import { Link } from "react-router-dom";
import type { UpNextItem } from "@/domain/entities/Progress";
import { RatingBadge } from "@/presentation/components/series/SeriesCard";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { RailSkeleton } from "@/presentation/components/ui/Skeleton";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import { useMarkUpNext, useMyRatings, useUpNext } from "@/presentation/hooks/useTracking";

function UpNextCard({ item, rating }: { item: UpNextItem; rating: number | null }) {
  const mark = useMarkUpNext();

  return (
    <div className="w-[132px] shrink-0">
      <Link to={`/series/${item.tmdbId}`} className="tap-none block active:opacity-75">
        <div className="relative">
          <SeriesPoster path={item.posterPath} alt={item.name} />
          {rating ? <RatingBadge value={rating} /> : null}
        </div>
        <p className="mt-2 truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-white">{item.name}</p>
      </Link>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-[0.75rem] font-medium tabular-nums text-mist-400">
          S{item.nextSeason} · E{item.nextEpisode}
        </span>
        <button
          type="button"
          disabled={mark.isPending}
          aria-label={`Mark S${item.nextSeason} E${item.nextEpisode} watched`}
          onClick={() =>
            mark.mutate({
              seriesId: item.seriesId,
              tmdbId: item.tmdbId,
              nextSeason: item.nextSeason,
              nextEpisode: item.nextEpisode,
            })
          }
          className="tap-none flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-800 text-accent-500 transition-colors hover:bg-ink-700 active:bg-accent-500 active:text-white disabled:opacity-50"
        >
          {mark.isPending ? (
            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3.5">
              <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export function UpNextRail() {
  const { t } = useI18n();
  const { data, isLoading } = useUpNext();
  const ratings = useMyRatings();

  if (isLoading) {
    return (
      <section className="mt-7">
        <h2 className="mb-3 px-5 text-[1.1875rem] font-bold tracking-[-0.015em] text-white">
          {t("continueWatching")}
        </h2>
        <RailSkeleton />
      </section>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="mt-7">
      <h2 className="mb-3 px-5 text-[1.1875rem] font-bold tracking-[-0.015em] text-white">
        {t("continueWatching")}
      </h2>
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-5 pb-1">
        {data.map((item) => (
          <UpNextCard key={item.seriesId} item={item} rating={ratings.get(item.tmdbId) ?? null} />
        ))}
      </div>
    </section>
  );
}
