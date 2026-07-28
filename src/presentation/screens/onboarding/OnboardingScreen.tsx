import { useEffect, useState } from "react";
import { releaseYear, type SeriesSummary } from "@/domain/entities/Series";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { Button } from "@/presentation/components/ui/Button";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useSearchSeries, useTrending } from "@/presentation/hooks/useDiscovery";
import { useSetSeriesStatus } from "@/presentation/hooks/useTracking";
import { plural } from "@/presentation/utils/plural";

function useDebounced(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function AddCard({
  series,
  added,
  onAdded,
}: {
  series: SeriesSummary;
  added: boolean;
  onAdded: (tmdbId: number) => void;
}) {
  const setStatus = useSetSeriesStatus(series.tmdbId);

  async function handleClick() {
    if (added || setStatus.isPending) {
      return;
    }
    await setStatus.mutateAsync("want_to_watch");
    onAdded(series.tmdbId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={setStatus.isPending}
      className="tap-none block text-left active:opacity-80"
    >
      <div className="relative">
        <SeriesPoster path={series.posterPath} alt={series.name} />
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-card transition-opacity ${
            added ? "bg-accent-600/70 opacity-100" : "opacity-0"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="size-8">
            <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {setStatus.isPending ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-card bg-ink-950/50">
            <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        ) : null}
      </div>
      <p className="mt-2 truncate text-[13px] font-semibold text-mist-100">{series.name}</p>
      {series.firstAirDate ? (
        <p className="mt-0.5 text-[11px] text-mist-400">{releaseYear(series)}</p>
      ) : null}
    </button>
  );
}

export function OnboardingScreen() {
  const { profile, completeOnboarding } = useAuth();
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [finishing, setFinishing] = useState(false);

  const { data: trending } = useTrending();
  const { data: searchResults, isFetching } = useSearchSeries(debounced);

  const searching = debounced.trim().length >= 2;
  const series = searching ? (searchResults?.results ?? []) : (trending?.results ?? []);

  function markAdded(tmdbId: number) {
    setAdded((current) => new Set(current).add(tmdbId));
  }

  async function finish() {
    setFinishing(true);
    try {
      await completeOnboarding();
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
        <p className="text-[13px] font-semibold tracking-wide text-accent-400 uppercase">
          Welcome{profile?.displayName || profile?.username ? `, ${profile.displayName || profile.username}` : ""}
        </p>
        <h1 className="mt-1 text-[26px] leading-tight font-bold text-mist-100">
          Add a few series you love
        </h1>
        <p className="mt-1.5 text-[14px] text-mist-400">
          This fills your library and tunes your recommendations. You can always add more later.
        </p>
      </header>

      <div className="sticky top-0 z-20 bg-ink-950/80 px-5 pb-3 backdrop-blur-xl">
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
        </div>
        {!searching ? (
          <p className="mt-3 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">Trending now</p>
        ) : null}
      </div>

      <div className="flex-1 px-5 pb-4">
        {searching && isFetching && !searchResults ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : series.length === 0 ? (
          <p className="pt-8 text-center text-[14px] text-mist-400">Nothing found for “{debounced}”.</p>
        ) : (
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5">
            {series.map((item) => (
              <AddCard
                key={item.tmdbId}
                series={item}
                added={added.has(item.tmdbId)}
                onAdded={markAdded}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="sticky bottom-0 border-t border-ink-800 bg-ink-950/90 px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-xl">
        <Button fullWidth loading={finishing} onClick={finish}>
          {added.size > 0 ? `Continue with ${plural(added.size, "series", "series")}` : "Continue"}
        </Button>
        {added.size === 0 ? (
          <button
            type="button"
            onClick={finish}
            disabled={finishing}
            className="tap-none mt-2 min-h-[44px] w-full text-[13px] font-medium text-mist-500 active:text-mist-300"
          >
            Skip for now
          </button>
        ) : null}
      </footer>
    </div>
  );
}
