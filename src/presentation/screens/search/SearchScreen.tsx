import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { releaseYear } from "@/domain/entities/Series";
import { Avatar } from "@/presentation/components/social/Avatar";
import { FollowButton } from "@/presentation/components/social/FollowButton";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
import { useMyLibraryStatus, useMyRatings, useMyWatched } from "@/presentation/hooks/useTracking";
import { PosterGridSkeleton } from "@/presentation/components/ui/Skeleton";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useGenres, useInfiniteDiscover, useSearchSeries } from "@/presentation/hooks/useDiscovery";
import { useInfiniteScroll } from "@/presentation/hooks/useInfiniteScroll";
import { useSearchProfiles } from "@/presentation/hooks/useSocial";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import { ScreenHeader } from "@/presentation/layout/ScreenHeader";
import { pluralize } from "@/presentation/utils/plural";

type Tab = "series" | "users";

const RECENT_KEY = "episodic_recent_searches";

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
  } catch {
    return;
  }
}

function useDebounced(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function GenreRecommendations({
  recentSearches,
  onSelectRecent,
  onClearRecent,
}: {
  recentSearches: string[];
  onSelectRecent: (term: string) => void;
  onClearRecent: () => void;
}) {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const genreParam = searchParams.get("genre");
  const genreId = genreParam ? Number(genreParam) : null;
  const ratings = useMyRatings();
  const watched = useMyWatched();
  const libraryStatus = useMyLibraryStatus();
  const { data: genres, isLoading: genresLoading } = useGenres();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteDiscover(genreId);

  const sentinelRef = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const active = genres?.find((genre) => genre.id === genreId);
  const results = data?.pages.flatMap((page) => page.results) ?? [];
  const seen = new Set<number>();
  const unique = results.filter((item) => {
    if (seen.has(item.tmdbId)) {
      return false;
    }
    seen.add(item.tmdbId);
    return true;
  });

  if (genresLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      {recentSearches.length > 0 ? (
        <div className="mb-5 px-5 pt-2">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[1.0625rem] font-bold tracking-[-0.015em] text-white">
              {t("recentSearches")}
            </span>
            <button
              type="button"
              onClick={onClearRecent}
              className="tap-none text-[0.9375rem] font-normal text-accent-500 active:opacity-70"
            >
              {t("clearHistory")}
            </button>
          </div>
          <div className="no-scrollbar flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSelectRecent(term)}
                className="tap-none rounded-full border border-white/[0.07] bg-ink-850 px-3.5 py-1.5 text-[0.8125rem] font-medium text-mist-300 transition-colors hover:bg-ink-800 hover:text-white"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto px-5 pt-2">
        <button
          type="button"
          onClick={() => setSearchParams({}, { replace: true })}
          className={`tap-none min-h-[34px] shrink-0 rounded-full px-4 text-[0.8125rem] font-semibold transition-colors ${
            genreId === null
              ? "bg-white text-black"
              : "border border-white/[0.07] bg-ink-850 text-mist-300 hover:bg-ink-800 hover:text-white"
          }`}
        >
          {t("popular")}
        </button>
        {(genres ?? []).map((genre) => (
          <button
            key={genre.id}
            type="button"
            onClick={() => setSearchParams({ genre: String(genre.id) }, { replace: true })}
            className={`tap-none min-h-[34px] shrink-0 rounded-full px-4 text-[0.8125rem] font-semibold transition-colors ${
              genreId === genre.id
                ? "bg-white text-black"
                : "border border-white/[0.07] bg-ink-850 text-mist-300 hover:bg-ink-800 hover:text-white"
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      <h2 className="mb-3 px-5 text-[1.1875rem] font-bold tracking-[-0.015em] text-white">
        {active ? active.name : t("recommendedForYou")}
      </h2>

      {isLoading ? (
        <PosterGridSkeleton count={12} />
      ) : (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {unique.map((series) => (
            <SeriesCard
              key={series.tmdbId}
              tmdbId={series.tmdbId}
              name={series.name}
              posterPath={series.posterPath}
              year={releaseYear(series)}
              rating={ratings.get(series.tmdbId) ?? null}
              watched={watched.has(series.tmdbId)}
              libraryStatus={libraryStatus.get(series.tmdbId) ?? null}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-px" />

      {isFetchingNextPage ? (
        <div className="flex h-16 items-center justify-center">
          <Spinner />
        </div>
      ) : null}
    </>
  );
}

function UserResults({ query }: { query: string }) {
  const { data, isFetching } = useSearchProfiles(query);

  if (query.trim().length < 2) {
    return (
      <p className="px-5 pt-8 text-center text-[0.9375rem] text-mist-500">
        Search for people by username to follow them.
      </p>
    );
  }

  if (isFetching && !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="px-5 pt-8 text-center text-[0.9375rem] text-mist-500">No one found for “{query}”.</p>
    );
  }

  return (
    <div className="mx-5 mt-2 overflow-hidden rounded-[14px] border border-white/[0.07] bg-ink-850 px-4">
      <ul className="divide-y divide-white/[0.08]">
        {data.map((profile) => (
          <li key={profile.id}>
            <Link
              to={`/user/${profile.username}`}
              className="tap-none flex items-center gap-3 py-3 active:opacity-70"
            >
              <Avatar
                username={profile.username}
                displayName={profile.displayName}
                avatarUrl={profile.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.9375rem] font-semibold text-white">
                  {profile.displayName || profile.username}
                </p>
                <p className="truncate text-[0.8125rem] text-mist-500">
                  @{profile.username} · {profile.seriesCount} series · {profile.followersCount}{" "}
                  {pluralize(profile.followersCount, "follower")}
                </p>
              </div>
              <FollowButton userId={profile.id} isFollowing={profile.isFollowing} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SeriesResults({
  query,
  recentSearches,
  onSelectRecent,
  onClearRecent,
}: {
  query: string;
  recentSearches: string[];
  onSelectRecent: (term: string) => void;
  onClearRecent: () => void;
}) {
  const { t } = useI18n();
  const { data, isFetching } = useSearchSeries(query);
  const ratings = useMyRatings();
  const watched = useMyWatched();
  const libraryStatus = useMyLibraryStatus();

  if (query.trim().length < 2) {
    return (
      <GenreRecommendations
        recentSearches={recentSearches}
        onSelectRecent={onSelectRecent}
        onClearRecent={onClearRecent}
      />
    );
  }

  if (isFetching && !data) {
    return <PosterGridSkeleton count={12} />;
  }

  if (!data || data.results.length === 0) {
    return (
      <p className="px-5 pt-8 text-center text-[0.9375rem] text-mist-500">
        {t("noResultsFor")} “{query}”.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-5 pt-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {data.results.map((series) => (
        <SeriesCard
          key={series.tmdbId}
          tmdbId={series.tmdbId}
          name={series.name}
          posterPath={series.posterPath}
          year={releaseYear(series)}
          rating={ratings.get(series.tmdbId) ?? null}
          watched={watched.has(series.tmdbId)}
          libraryStatus={libraryStatus.get(series.tmdbId) ?? null}
        />
      ))}
    </div>
  );
}

export function SearchScreen() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab = tabParam === "users" ? "users" : "series";
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);

  useEffect(() => {
    const trimmed = debounced.trim();
    if (trimmed.length >= 2 && tab === "series") {
      const prev = getRecentSearches();
      const next = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      saveRecentSearches(next);
    }
  }, [debounced, tab]);

  function handleClearRecent() {
    saveRecentSearches([]);
    setRecentSearches([]);
  }

  function setTab(next: Tab) {
    const params: Record<string, string> = {};
    if (next === "users") params.tab = "users";
    setSearchParams(params, { replace: true });
  }

  return (
    <>
      <ScreenHeader title={t("search")} />

      <div className="ios-material sticky top-0 z-20 border-b border-white/[0.08] px-5 pt-2 pb-3">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className="pointer-events-none absolute top-1/2 left-3 size-[17px] -translate-y-1/2 text-mist-500"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            inputMode="search"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder={tab === "series" ? t("searchSeriesPlaceholder") : t("searchPeoplePlaceholder")}
            value={query}
            onChange={(event) => {
              const nextVal = event.target.value;
              setQuery(nextVal);
              if (!nextVal.trim()) {
                setRecentSearches(getRecentSearches());
              }
            }}
            className="w-full rounded-[10px] bg-ink-850 py-2 pr-9 pl-9 text-[1.0625rem] text-white placeholder:text-mist-500 transition-colors focus:bg-ink-800 focus:outline-none"
          />
          {query.length > 0 ? (
            <button
              type="button"
              aria-label={t("clearHistory")}
              onClick={() => {
                setQuery("");
                setRecentSearches(getRecentSearches());
              }}
              className="tap-none absolute top-1/2 right-2.5 -translate-y-1/2 flex size-[18px] items-center justify-center rounded-full bg-mist-500 text-ink-950 transition-opacity active:opacity-70"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </div>

        <div className="mt-2.5 flex rounded-[9px] bg-ink-850 p-[2px]">
          {(["series", "users"] as Tab[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`tap-none min-h-[30px] flex-1 rounded-[7px] text-[0.8125rem] font-semibold transition-all duration-150 ${
                tab === value
                  ? "bg-ink-700 text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                  : "text-mist-400 hover:text-mist-200"
              }`}
            >
              {value === "series" ? t("series") : t("people")}
            </button>
          ))}
        </div>
      </div>

      {tab === "series" ? (
        <SeriesResults
          query={debounced}
          recentSearches={recentSearches}
          onSelectRecent={(term) => setQuery(term)}
          onClearRecent={handleClearRecent}
        />
      ) : (
        <UserResults query={debounced} />
      )}
    </>
  );
}
