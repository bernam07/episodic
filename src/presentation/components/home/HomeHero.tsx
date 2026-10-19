import { Link } from "react-router-dom";
import { backdropUrl } from "@/data/tmdb/images";
import { releaseYear, type SeriesSummary } from "@/domain/entities/Series";
import { useI18n } from "@/presentation/i18n/I18nProvider";

export function HomeHero({ series }: { series: SeriesSummary }) {
  const { t } = useI18n();
  const backdrop = backdropUrl(series.backdropPath, "w1280");
  const year = releaseYear(series);

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
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-accent-500 px-2.5 py-0.5 text-[0.6875rem] font-extrabold tracking-[0.02em] text-white shadow-sm">
              {t("trendingNow")}
            </span>
            <span className="rounded-[4px] bg-[#f5c518] px-1.5 py-0.5 text-[0.6875rem] font-black text-black">
              TMDB
            </span>
            {series.voteAverage && series.voteAverage > 0 ? (
              <span className="inline-flex items-center gap-1 text-[0.75rem] font-bold tabular-nums text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-3 text-star-500">
                  <path d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z" />
                </svg>
                {series.voteAverage.toFixed(1)}
              </span>
            ) : null}
          </div>
          <h2 className="mt-2.5 text-[1.625rem] leading-[1.12] font-extrabold tracking-[-0.025em] text-white md:text-[2.125rem]">
            {series.name}
            {year ? <span className="font-semibold text-mist-300"> ({year})</span> : null}
          </h2>
          {series.overview ? (
            <p className="mt-1.5 line-clamp-2 max-w-xl text-[0.8125rem] leading-relaxed text-mist-300">{series.overview}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
