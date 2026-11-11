import { Link } from "react-router-dom";
import type { UpNextItem } from "@/domain/entities/Progress";
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
  const episodeCode = `S${String(item.nextSeason).padStart(2, "0")}E${String(item.nextEpisode).padStart(2, "0")}`;

  return (
    <div className="flex w-[292px] shrink-0 items-center gap-3.5 rounded-[16px] border border-white/[0.08] bg-ink-850/95 p-3 shadow-lg shadow-black/25 transition-colors hover:border-white/[0.14] sm:w-[320px]">
      <Link to={`/series/${item.tmdbId}`} className="tap-none relative w-[56px] shrink-0 active:opacity-75">
        <SeriesPoster path={item.posterPath} alt={item.name} />
        {rating ? (
          <span className="ios-material absolute right-1 bottom-1 flex items-center gap-0.5 rounded-[5px] border border-white/15 px-1 py-0.5 text-[0.625rem] font-bold tabular-nums text-star-500">
            ★ {rating.toFixed(1)}
          </span>
        ) : null}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <Link
            to={`/series/${item.tmdbId}`}
            className="tap-none truncate text-[0.9375rem] font-bold tracking-[-0.015em] text-white hover:text-mist-200"
          >
            {item.name}
          </Link>
          {left > 0 ? (
            <span className="shrink-0 text-[0.6875rem] font-semibold tabular-nums text-mist-400">
              {t("episodesLeft", { count: left })}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center rounded-[6px] bg-accent-500/15 px-1.5 py-0.5 text-[0.6875rem] font-extrabold tabular-nums text-accent-400">
            {episodeCode}
          </span>
          {total > 0 ? (
            <span className="truncate text-[0.75rem] tabular-nums text-mist-500">
              {item.watchedEpisodes}/{total} {t("episodes")}
            </span>
          ) : null}
        </div>

        {total > 0 ? <ProgressBar value={percent} className="mt-2.5" /> : null}
      </div>

      <button
        type="button"
        disabled={mark.isPending}
        aria-label={`Mark ${episodeCode} watched`}
        onClick={() =>
          mark.mutate({
            seriesId: item.seriesId,
            tmdbId: item.tmdbId,
            nextSeason: item.nextSeason,
            nextEpisode: item.nextEpisode,
          })
        }
        className="glow-accent-sm tap-none flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white transition-all hover:bg-accent-400 active:scale-95 disabled:opacity-50"
      >
        {mark.isPending ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" className="size-4">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
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
        <span className="text-[0.75rem] font-semibold tabular-nums text-mist-500">
          {data.length} {t("series").toLowerCase()}
        </span>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {data.map((item) => (
          <UpNextCard key={item.seriesId} item={item} rating={ratings.get(item.tmdbId) ?? null} />
        ))}
      </div>
    </section>
  );
}
