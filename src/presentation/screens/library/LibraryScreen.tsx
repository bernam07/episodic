import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { posterUrl } from "@/data/tmdb/images";
import {
  SERIES_STATUSES,
  type SeriesStatus,
} from "@/domain/entities/SeriesStatus";
import type { SeriesProgress } from "@/domain/entities/Progress";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
import { StatusBadge } from "@/presentation/components/series/StatusBadge";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { PosterGridSkeleton } from "@/presentation/components/ui/Skeleton";
import { useLibrary } from "@/presentation/hooks/useTracking";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import { useToast } from "@/presentation/providers/ToastProvider";
import { ScreenHeader } from "@/presentation/layout/ScreenHeader";

type Filter = SeriesStatus | "all";
type ViewMode = "grid" | "list";

const FILTERS: Filter[] = ["all", ...SERIES_STATUSES];
const VALID_FILTERS = new Set<string>(FILTERS);

type SortKey = "recent" | "alpha" | "rating" | "progress";

const SORT_FNS: Record<SortKey, (a: SeriesProgress, b: SeriesProgress) => number> = {
  recent: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  alpha: (a, b) => a.name.localeCompare(b.name),
  rating: (a, b) => (b.userRating ?? 0) - (a.userRating ?? 0) || b.updatedAt.localeCompare(a.updatedAt),
  progress: (a, b) => b.progressPercent - a.progressPercent || a.name.localeCompare(a.name),
};

function SeriesListRow({ item }: { item: SeriesProgress }) {
  const poster = posterUrl(item.posterPath, "w154");

  return (
    <Link
      to={`/series/${item.tmdbId}`}
      className="group tap-none flex items-center gap-3.5 rounded-[14px] border border-white/[0.07] bg-ink-850 p-3.5 transition-colors hover:bg-ink-800 active:opacity-75"
    >
      <div className="relative h-18 w-12 shrink-0 overflow-hidden rounded-[8px] bg-ink-800 ring-1 ring-white/10 ring-inset">
        {poster ? (
          <img
            src={poster}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[0.625rem] text-mist-500">N/A</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-white">{item.name}</h3>
          <span className="shrink-0 text-[0.75rem] font-medium tabular-nums text-mist-500">
            {item.watchedEpisodes}/{item.numberOfEpisodes}
          </span>
        </div>

        <ProgressBar value={item.progressPercent} className="mt-2.5" />

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={item.status} />
            {item.rewatchCount > 0 ? (
              <span className="rounded-full border border-white/10 bg-ink-800 px-2 py-0.5 text-[0.6875rem] font-semibold text-mist-300">
                {item.rewatchCount}×
              </span>
            ) : null}
          </div>

          {item.userRating ? (
            <div className="flex items-center gap-1 text-[0.75rem] font-semibold tabular-nums text-star-500">
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
                <path d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z" />
              </svg>
              {item.userRating.toFixed(1)}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function LibraryScreen() {
  const { t } = useI18n();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramValue = searchParams.get("status");
  const filter: Filter =
    paramValue && VALID_FILTERS.has(paramValue) ? (paramValue as Filter) : "all";

  const viewParam = searchParams.get("view");
  const view =
    viewParam === "favorites" || viewParam === "rewatched" || viewParam === "rated" ? viewParam : null;
  const ratingParam = searchParams.get("rating");
  const focused = view !== null;
  const focusLabel =
    view === "rated"
      ? ratingParam
        ? `Rated ${ratingParam} ★`
        : t("sortRating")
      : view === "favorites"
        ? "Favorites"
        : t("rewatched");

  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    return (localStorage.getItem("episodic_library_view_mode") as ViewMode) || "grid";
  });

  function setViewMode(mode: ViewMode) {
    setViewModeState(mode);
    localStorage.setItem("episodic_library_view_mode", mode);
  }

  const { data, isLoading } = useLibrary();
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortKey>("recent");
  const [search, setSearch] = useState("");

  const filterLabels: Record<Filter, string> = {
    all: t("all"),
    want_to_watch: t("wantToWatch"),
    watching: t("watching"),
    watched: t("watched"),
    abandoned: t("abandoned"),
  };

  const sortLabels: Record<SortKey, string> = {
    recent: t("sortRecent"),
    alpha: t("sortAlpha"),
    rating: t("sortRating"),
    progress: t("sortProgress"),
  };

  function surpriseMe() {
    if (!data || data.length === 0) return;
    const wantToWatch = data.filter((item) => item.status === "want_to_watch");
    const pool = wantToWatch.length > 0 ? wantToWatch : data;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    toast.show(`${t("surpriseMe")}: ${pick.name}`);
    navigate(`/series/${pick.tmdbId}`);
  }

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: data?.length ?? 0,
      want_to_watch: 0,
      watching: 0,
      watched: 0,
      abandoned: 0,
    };

    for (const item of data ?? []) {
      base[item.status] += 1;
    }

    return base;
  }, [data]);

  const genreParam = searchParams.get("genre");

  const allGenres = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const item of data) {
      for (const g of item.genres) set.add(g);
    }
    return [...set].sort();
  }, [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    let result = data;
    if (view === "favorites") result = result.filter((item) => item.isFavorite);
    else if (view === "rewatched") result = result.filter((item) => item.rewatchCount > 0);
    else if (view === "rated") {
      result = result.filter(
        (item) => item.userRating !== null && (!ratingParam || item.userRating === Number(ratingParam))
      );
    }
    if (filter !== "all") result = result.filter((item) => item.status === filter);
    if (genreParam) result = result.filter((item) => item.genres.includes(genreParam));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }
    if (filter !== "all" || focused) {
      result = [...result].sort(SORT_FNS[sort]);
    }
    return result;
  }, [data, filter, view, ratingParam, focused, genreParam, search, sort]);

  function setFilter(next: Filter) {
    const params: Record<string, string> = {};
    if (next !== "all") params.status = next;
    if (genreParam) params.genre = genreParam;
    setSearchParams(params, { replace: true });
  }

  function setGenre(genre: string | null) {
    const params: Record<string, string> = {};
    if (filter !== "all") params.status = filter;
    if (genre) params.genre = genre;
    setSearchParams(params, { replace: true });
  }

  function clearView() {
    setSearchParams({}, { replace: true });
  }

  return (
    <>
      <ScreenHeader
        title={t("library")}
        subtitle={data && data.length > 0 ? `${data.length} ${t("series")}` : undefined}
      />

      <div className="ios-material sticky top-0 z-20 px-5 pt-2.5 pb-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className="pointer-events-none absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2 text-mist-500"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              inputMode="search"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder={t("searchLibraryPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-[12px] border border-white/[0.08] bg-ink-850 py-2.5 pr-4 pl-10 text-[0.9375rem] text-white placeholder:text-mist-500 transition-colors focus:border-accent-500 focus:bg-ink-800 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            aria-label={viewMode === "grid" ? t("listView") : t("gridView")}
            title={viewMode === "grid" ? t("listView") : t("gridView")}
            className="tap-none flex size-[42px] shrink-0 items-center justify-center rounded-[12px] border border-white/[0.08] bg-ink-850 text-white transition-opacity active:opacity-70 hover:bg-ink-800"
          >
            {viewMode === "grid" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[19px]">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[19px]">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={surpriseMe}
            disabled={!data || data.length === 0}
            aria-label={t("surpriseMe")}
            title={t("surpriseMe")}
            className="tap-none flex size-[42px] shrink-0 items-center justify-center rounded-[12px] border border-white/[0.08] bg-ink-850 text-white transition-opacity active:opacity-70 hover:bg-ink-800 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[19px]">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
      </div>

      {focused ? (
        <div className="ios-material sticky top-[56px] z-20 border-b border-white/[0.08] px-5 pb-3.5">
          <button
            type="button"
            onClick={clearView}
            className="tap-none inline-flex items-center gap-1.5 rounded-full bg-accent-500/15 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-accent-400 transition-opacity active:opacity-70"
          >
            {focusLabel}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="ios-material no-scrollbar sticky top-[56px] z-20 flex gap-6 overflow-x-auto border-b border-white/[0.08] px-5">
          {FILTERS.map((value) => {
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`tap-none relative flex shrink-0 items-center gap-1.5 py-2.5 text-[0.875rem] font-semibold transition-colors ${
                  active ? "text-white" : "text-mist-500 hover:text-mist-300"
                }`}
              >
                {filterLabels[value]}
                <span
                  className={`text-[0.75rem] tabular-nums ${
                    active ? "text-mist-300" : "text-mist-500"
                  }`}
                >
                  {counts[value]}
                </span>
                {active ? (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-white" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {!focused && allGenres.length > 0 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-3 pb-4">
          <button
            type="button"
            onClick={() => setGenre(null)}
            className={`tap-none shrink-0 rounded-full px-3.5 py-1.5 text-[0.75rem] font-semibold transition-colors ${
              !genreParam
                ? "bg-accent-500 text-white"
                : "border border-white/[0.07] bg-ink-850 text-mist-300 hover:bg-ink-800 hover:text-white"
            }`}
          >
            {t("allGenres")}
          </button>
          {allGenres.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => setGenre(genreParam === genre ? null : genre)}
              className={`tap-none shrink-0 rounded-full px-3.5 py-1.5 text-[0.75rem] font-semibold transition-colors ${
                genreParam === genre
                  ? "bg-accent-500 text-white"
                  : "border border-white/[0.07] bg-ink-850 text-mist-300 hover:bg-ink-800 hover:text-white"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      ) : null}

      {(focused || filter !== "all") && visible.length > 1 ? (
        <div className="flex items-center gap-1.5 px-5 pt-2 pb-4">
          <span className="mr-1 text-[0.75rem] text-mist-500">{t("sortBy")}</span>
          {(Object.keys(sortLabels) as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={`tap-none rounded-full px-2.5 py-1 text-[0.75rem] font-medium transition-colors ${
                sort === key ? "bg-white text-black" : "bg-ink-850 text-mist-400 active:bg-ink-700"
              }`}
            >
              {sortLabels[key]}
            </button>
          ))}
        </div>
      ) : null}

      {isLoading ? <PosterGridSkeleton count={12} /> : null}

      {!isLoading && (data?.length ?? 0) === 0 ? (
        <div className="px-5 pt-10 text-center">
          <p className="text-[1.0625rem] font-semibold text-white">{t("libraryEmpty")}</p>
          <p className="mt-1 text-[0.875rem] text-mist-500">{t("libraryEmptySub")}</p>
          <Link
            to="/search"
            className="tap-none mt-5 inline-flex min-h-[44px] items-center rounded-[12px] bg-accent-500 px-5 text-[1.0625rem] font-semibold text-white active:opacity-80"
          >
            {t("search")} {t("series")}
          </Link>
        </div>
      ) : null}

      {!isLoading && (data?.length ?? 0) > 0 && visible.length === 0 ? (
        <p className="px-5 pt-8 text-center text-[0.9375rem] text-mist-500">
          Nothing in {focused ? focusLabel : filterLabels[filter]} yet.
        </p>
      ) : null}

      {visible.length > 0 && filter === "all" && !focused ? (
        <div className="space-y-7 px-5 pt-3">
          {SERIES_STATUSES.map((status) => {
            const group = visible.filter((item) => item.status === status);
            if (group.length === 0) return null;
            return (
              <section key={status}>
                <h2 className="mb-3 flex items-baseline gap-2 text-[1.1875rem] font-bold tracking-[-0.015em] text-white">
                  <span>{filterLabels[status]}</span>
                  <span className="text-[0.875rem] font-normal text-mist-500">{group.length}</span>
                </h2>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                    {group.map((item) => (
                      <SeriesCard
                        key={item.seriesId}
                        tmdbId={item.tmdbId}
                        name={item.name}
                        posterPath={item.posterPath}
                        status={item.status}
                        caption={`${item.watchedEpisodes}/${item.numberOfEpisodes} ${t("episodes")}`}
                        progressPercent={item.progressPercent}
                        rating={item.userRating}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {group.map((item) => (
                      <SeriesListRow key={item.seriesId} item={item} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : null}

      {visible.length > 0 && (filter !== "all" || focused) ? (
        <div className="px-5 pt-3">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {visible.map((item) => (
                <SeriesCard
                  key={item.seriesId}
                  tmdbId={item.tmdbId}
                  name={item.name}
                  posterPath={item.posterPath}
                  status={item.status}
                  caption={`${item.watchedEpisodes}/${item.numberOfEpisodes} ${t("episodes")}`}
                  progressPercent={item.progressPercent}
                  rating={item.userRating}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {visible.map((item) => (
                <SeriesListRow key={item.seriesId} item={item} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
