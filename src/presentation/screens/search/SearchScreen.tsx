import { useEffect, useState } from "react";
import { releaseYear } from "@/domain/entities/Series";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useSearchSeries } from "@/presentation/hooks/useDiscovery";
import { ScreenHeader } from "@/presentation/layout/ScreenHeader";

function useDebounced(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function SearchScreen() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);
  const { data, isFetching } = useSearchSeries(debouncedQuery);

  const showEmpty = debouncedQuery.trim().length >= 2 && data && data.results.length === 0 && !isFetching;

  return (
    <>
      <ScreenHeader title="Search" />

      <div className="sticky top-0 z-20 bg-ink-950/80 px-5 pb-4 backdrop-blur-xl">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-mist-500"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            inputMode="search"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="Search series"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-ink-700 bg-ink-850 py-3 pr-4 pl-10 text-mist-100 placeholder:text-mist-500 focus:border-accent-500 focus:outline-none"
          />
          {isFetching ? (
            <span className="absolute top-1/2 right-3.5 -translate-y-1/2">
              <Spinner className="size-4" />
            </span>
          ) : null}
        </div>
      </div>

      {showEmpty ? (
        <p className="px-5 pt-8 text-center text-[14px] text-mist-400">
          Nothing found for “{debouncedQuery}”.
        </p>
      ) : null}

      {!data && debouncedQuery.trim().length < 2 ? (
        <p className="px-5 pt-8 text-center text-[14px] text-mist-500">
          Find a series to start tracking.
        </p>
      ) : null}

      {data && data.results.length > 0 ? (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {data.results.map((series) => (
            <SeriesCard
              key={series.tmdbId}
              tmdbId={series.tmdbId}
              name={series.name}
              posterPath={series.posterPath}
              year={releaseYear(series)}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
