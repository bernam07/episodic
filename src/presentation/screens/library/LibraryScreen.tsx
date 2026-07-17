import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  SERIES_STATUS_LABELS,
  SERIES_STATUSES,
  type SeriesStatus,
} from "@/domain/entities/SeriesStatus";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useLibrary } from "@/presentation/hooks/useTracking";
import { ScreenHeader } from "@/presentation/layout/ScreenHeader";

type Filter = SeriesStatus | "all" | "favorites";

const FILTERS: Filter[] = ["all", ...SERIES_STATUSES, "favorites"];

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  ...SERIES_STATUS_LABELS,
  favorites: "Favorites",
};

const VALID_FILTERS = new Set<string>(FILTERS);

export function LibraryScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramValue = searchParams.get("status");
  const filter: Filter =
    paramValue && VALID_FILTERS.has(paramValue) ? (paramValue as Filter) : "all";

  const { data, isLoading } = useLibrary();

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: data?.length ?? 0,
      want_to_watch: 0,
      watching: 0,
      watched: 0,
      abandoned: 0,
      favorites: 0,
    };

    for (const item of data ?? []) {
      base[item.status] += 1;
      if (item.isFavorite) base.favorites += 1;
    }

    return base;
  }, [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    if (filter === "favorites") return data.filter((item) => item.isFavorite);
    if (filter === "all") return data;
    return data.filter((item) => item.status === filter);
  }, [data, filter]);

  function setFilter(next: Filter) {
    if (next === "all") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ status: next }, { replace: true });
    }
  }

  return (
    <>
      <ScreenHeader
        title="Library"
        subtitle={data && data.length > 0 ? `${data.length} series tracked` : undefined}
      />

      <div className="no-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto bg-ink-950/80 px-5 pb-4 backdrop-blur-xl">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`tap-none flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              filter === value ? "bg-accent-600 text-white" : "bg-ink-800 text-mist-400 active:bg-ink-700"
            }`}
          >
            {FILTER_LABELS[value]}
            <span
              className={`text-[11px] tabular-nums ${
                filter === value ? "text-white/70" : "text-mist-500"
              }`}
            >
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : null}

      {!isLoading && (data?.length ?? 0) === 0 ? (
        <div className="px-5 pt-10 text-center">
          <p className="text-[15px] font-semibold text-mist-200">Your library is empty</p>
          <p className="mt-1 text-[13px] text-mist-500">Find a series and add it to start tracking.</p>
          <Link
            to="/search"
            className="tap-none mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-accent-600 px-5 text-[14px] font-semibold text-white active:bg-accent-500"
          >
            Search series
          </Link>
        </div>
      ) : null}

      {!isLoading && (data?.length ?? 0) > 0 && visible.length === 0 ? (
        <p className="px-5 pt-8 text-center text-[14px] text-mist-500">
          Nothing in {FILTER_LABELS[filter]} yet.
        </p>
      ) : null}

      {visible.length > 0 ? (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {visible.map((item) => (
            <SeriesCard
              key={item.seriesId}
              tmdbId={item.tmdbId}
              name={item.name}
              posterPath={item.posterPath}
              status={item.status}
              caption={`${item.watchedEpisodes}/${item.numberOfEpisodes} episodes`}
              progressPercent={item.progressPercent}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
