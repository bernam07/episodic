import { Link } from "react-router-dom";
import { backdropUrl } from "@/data/tmdb/images";
import type { SeriesSummary } from "@/domain/entities/Series";
import { useI18n } from "@/presentation/i18n/I18nProvider";

export function HomeHero({ series }: { series: SeriesSummary }) {
  const { t } = useI18n();
  const backdrop = backdropUrl(series.backdropPath, "w1280");

  return (
    <Link to={`/series/${series.tmdbId}`} className="group tap-none relative block overflow-hidden active:opacity-95">
      <div className="relative h-[260px] w-full overflow-hidden bg-ink-900 md:h-[360px] md:rounded-3xl md:border md:border-white/10 md:shadow-2xl md:shadow-black/60">
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            fetchPriority="high"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[11px] font-semibold text-accent-300 shadow-md backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-accent-400" />
            <span className="uppercase tracking-wider">{t("trendingNow")}</span>
          </div>
          <h2 className="mt-2.5 text-[26px] leading-tight font-extrabold tracking-tight text-white md:text-[32px]">{series.name}</h2>
          {series.overview ? (
            <p className="mt-1.5 line-clamp-2 max-w-xl text-[13px] leading-relaxed text-mist-300">{series.overview}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
