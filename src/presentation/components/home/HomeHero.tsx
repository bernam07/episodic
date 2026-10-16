import { Link } from "react-router-dom";
import { backdropUrl } from "@/data/tmdb/images";
import type { SeriesSummary } from "@/domain/entities/Series";
import { useI18n } from "@/presentation/i18n/I18nProvider";

export function HomeHero({ series }: { series: SeriesSummary }) {
  const { t } = useI18n();
  const backdrop = backdropUrl(series.backdropPath, "w1280");

  return (
    <Link to={`/series/${series.tmdbId}`} className="group tap-none relative block overflow-hidden active:opacity-95">
      <div className="relative h-[280px] w-full overflow-hidden bg-ink-900 md:h-[380px] md:rounded-[20px] md:ring-1 md:ring-white/10 md:ring-inset md:shadow-2xl md:shadow-black/70">
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            fetchPriority="high"
          />
        ) : null}
        <div className="hero-scrim absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
          <div className="ios-material inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[0.75rem] font-semibold text-white/90">
            <span className="size-1.5 rounded-full bg-accent-500" />
            <span>{t("trendingNow")}</span>
          </div>
          <h2 className="mt-2.5 text-[1.75rem] leading-[1.12] font-bold tracking-[-0.022em] text-white md:text-[2.125rem]">{series.name}</h2>
          {series.overview ? (
            <p className="mt-1.5 line-clamp-2 max-w-xl text-[0.875rem] text-mist-300">{series.overview}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
