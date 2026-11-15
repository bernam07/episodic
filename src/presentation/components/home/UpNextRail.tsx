import { Link } from "react-router-dom";
import type { UpNextItem } from "@/domain/entities/Progress";
import { RatingBadge } from "@/presentation/components/series/SeriesCard";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { RailSkeleton } from "@/presentation/components/ui/Skeleton";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import { useMarkUpNext, useMyRatings, useUpNext } from "@/presentation/hooks/useTracking";

function UpNextCard({ item, rating }: { item: UpNextItem; rating: number | null }) {
  const { t } = useI18n();
  const mark = useMarkUpNext();
  const total = item.airedEpisodes > 0 ? item.airedEpisodes : item.numberOfEpisodes;
  const percent = total > 0 ? Math.min(Math.round((item.watchedEpisodes / total) * 1000) / 10, 100) : 0;
  const left = Math.max(total - item.watchedEpisodes, 0);

  return (
    <div className="w-[138px] shrink-0">
      <Link to={`/series/${item.tmdbId}`} className="tap-none relative block active:opacity-75">
        <SeriesPoster path={item.posterPath} alt={item.name} />
        {rating ? <RatingBadge value={rating} /> : null}
      </Link>
      <div className="mt-2 px-0.5">
        <Link
          to={`/series/${item.tmdbId}`}
          className="tap-none block truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-white"
        >
          {item.name}
        </Link>
        {total > 0 ? <ProgressBar value={percent} className="mt-1.5" /> : null}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="block text-[0.75rem] font-semibold tabular-nums text-accent-400">
              S{item.nextSeason} · E{item.nextEpisode}
            </span>
            {left > 0 ? (
              <span className="block truncate text-[0.6875rem] tabular-nums text-mist-500">
                {t("episodesLeft", { count: left })}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            disabled={mark.isPending}
            aria-label={`Mark S${item.nextSeason}E${item.nextEpisode} watched`}
            onClick={() =>
              mark.mutate({
                seriesId: item.seriesId,
                tmdbId: item.tmdbId,
                nextSeason: item.nextSeason,
                nextEpisode: item.nextEpisode,
              })
            }
            className="glow-accent-sm tap-none flex size-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-ink-800 text-mist-300 transition-all hover:border-accent-500 hover:bg-accent-500 hover:text-white active:scale-95 disabled:opacity-50"
          >
            {mark.isPending ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="size-3.5">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
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
      <div className="mb-3 flex items-baseline justify-between px-5">
        <h2 className="text-[1.1875rem] font-bold tracking-[-0.015em] text-white">
          {t("continueWatching")}
        </h2>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {data.map((item) => (
          <UpNextCard key={item.seriesId} item={item} rating={ratings.get(item.tmdbId) ?? null} />
        ))}
      </div>
    </section>
  );
}
