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
      <Link to={`/series/${item.tmdbId}`} className="tap-none block active:opacity-70">
        <div className="relative">
          <SeriesPoster path={item.posterPath} alt={item.name} />
          {rating ? <RatingBadge value={rating} /> : null}
        </div>
        <p className="mt-2 truncate text-[13px] font-semibold text-mist-100">{item.name}</p>
      </Link>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium tabular-nums text-accent-400">
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
          className="tap-none flex size-7 shrink-0 items-center justify-center rounded-full border border-ink-600 text-mist-400 transition-colors active:border-accent-500 active:bg-accent-500 active:text-white disabled:opacity-50"
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
        <h2 className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
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
      <h2 className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        {t("continueWatching")}
      </h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {data.map((item) => (
          <UpNextCard key={item.seriesId} item={item} rating={ratings.get(item.tmdbId) ?? null} />
        ))}
      </div>
    </section>
  );
}
