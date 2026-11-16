import { useEffect, useState } from "react";
import { releaseYear, type SeriesSummary } from "@/domain/entities/Series";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { BrandMark } from "@/presentation/components/ui/BrandMark";
import { Button } from "@/presentation/components/ui/Button";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useSearchSeries, useTrending } from "@/presentation/hooks/useDiscovery";
import { useSetSeriesStatus } from "@/presentation/hooks/useTracking";
import { useI18n } from "@/presentation/i18n/I18nProvider";

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
      className="tap-none block text-left active:opacity-75"
    >
      <div className="relative">
        <SeriesPoster path={series.posterPath} alt={series.name} />
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-[12px] transition-opacity ${
            added ? "bg-accent-500/75 opacity-100" : "opacity-0"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="size-8">
            <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {setStatus.isPending ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-[12px] bg-black/50">
            <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        ) : null}
      </div>
      <p className="mt-2 truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-white">{series.name}</p>
      {series.firstAirDate ? (
        <p className="mt-0.5 text-[0.75rem] text-mist-500">{releaseYear(series)}</p>
      ) : null}
    </button>
  );
}

export function OnboardingScreen() {
  const { t } = useI18n();
  const { completeOnboarding } = useAuth();
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
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col overflow-x-clip">
      <header className="ios-material sticky top-0 z-20 border-b border-white/[0.08] px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <h1 className="text-[1.25rem] font-extrabold tracking-[-0.025em] text-white">
              {t("welcomeTitle")}
            </h1>
          </div>
          {added.size === 0 ? (
            <button
              type="button"
              onClick={finish}
              disabled={finishing}
              className="tap-none shrink-0 text-[0.8125rem] font-semibold text-accent-400 active:opacity-70"
            >
              {t("skipForNow")}
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-[0.8125rem] text-mist-400">
          {t("welcomeSub")}
        </p>

        <div className="relative mt-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className="pointer-events-none absolute top-1/2 left-3 size-[16px] -translate-y-1/2 text-mist-500"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            inputMode="search"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder={t("searchSeriesPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-[11px] border border-white/[0.08] bg-ink-850 py-2 pr-4 pl-9 text-[0.9375rem] text-white placeholder:text-mist-500 transition-colors focus:border-accent-500/60 focus:bg-ink-800 focus:outline-none"
          />
        </div>
      </header>

      <div className="flex-1 px-5 pt-4 pb-6">
        {!searching ? (
          <h2 className="mb-3 text-[0.9375rem] font-bold tracking-[-0.015em] text-white">
            {t("trendingNow")}
          </h2>
        ) : null}

        {searching && isFetching && !searchResults ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : series.length === 0 ? (
          <p className="pt-8 text-center text-[0.9375rem] text-mist-500">
            {t("noResultsFor")} “{debounced}”.
          </p>
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

      <footer className="ios-material sticky bottom-0 border-t border-white/[0.12] px-5 py-3.5 pb-[calc(env(safe-area-inset-bottom)+0.875rem)]">
        <Button fullWidth loading={finishing} onClick={finish}>
          {added.size > 0 ? t("continueWithCount", { count: added.size }) : t("continueBtn")}
        </Button>
      </footer>
    </div>
  );
}
