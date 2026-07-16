import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { releaseYear } from "@/domain/entities/Series";
import { Avatar } from "@/presentation/components/social/Avatar";
import { FollowButton } from "@/presentation/components/social/FollowButton";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useGenres, useInfiniteDiscover, useSearchSeries } from "@/presentation/hooks/useDiscovery";
import { useInfiniteScroll } from "@/presentation/hooks/useInfiniteScroll";
import { useSearchProfiles } from "@/presentation/hooks/useSocial";
import { ScreenHeader } from "@/presentation/layout/ScreenHeader";

type Tab = "series" | "users";

function useDebounced(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function GenreRecommendations() {
  const [genreId, setGenreId] = useState<number | null>(null);
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
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto px-5">
        <button
          type="button"
          onClick={() => setGenreId(null)}
          className={`tap-none min-h-[34px] shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${
            genreId === null ? "bg-accent-600 text-white" : "bg-ink-800 text-mist-400 active:bg-ink-700"
          }`}
        >
          Popular
        </button>
        {(genres ?? []).map((genre) => (
          <button
            key={genre.id}
            type="button"
            onClick={() => setGenreId(genre.id)}
            className={`tap-none min-h-[34px] shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              genreId === genre.id
                ? "bg-accent-600 text-white"
                : "bg-ink-800 text-mist-400 active:bg-ink-700"
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      <h2 className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        {active ? `Recommended in ${active.name}` : "Recommended for you"}
      </h2>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {unique.map((series) => (
            <SeriesCard
              key={series.tmdbId}
              tmdbId={series.tmdbId}
              name={series.name}
              posterPath={series.posterPath}
              year={releaseYear(series)}
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
      <p className="px-5 pt-8 text-center text-[14px] text-mist-500">
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
      <p className="px-5 pt-8 text-center text-[14px] text-mist-400">No one found for “{query}”.</p>
    );
  }

  return (
    <ul className="divide-y divide-ink-800 px-5">
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
              <p className="truncate text-[14px] font-semibold text-mist-100">
                {profile.displayName || profile.username}
              </p>
              <p className="truncate text-[12px] text-mist-500">
                @{profile.username} · {profile.seriesCount} series · {profile.followersCount} followers
              </p>
            </div>
            <FollowButton userId={profile.id} isFollowing={profile.isFollowing} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SeriesResults({ query }: { query: string }) {
  const { data, isFetching } = useSearchSeries(query);

  if (query.trim().length < 2) {
    return <GenreRecommendations />;
  }

  if (isFetching && !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <p className="px-5 pt-8 text-center text-[14px] text-mist-400">Nothing found for “{query}”.</p>
    );
  }

  return (
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
  );
}

export function SearchScreen() {
  const [tab, setTab] = useState<Tab>("series");
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query);

  return (
    <>
      <ScreenHeader title="Search" />

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
            placeholder={tab === "series" ? "Search series" : "Search people"}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-ink-700 bg-ink-850 py-3 pr-4 pl-10 text-mist-100 placeholder:text-mist-500 focus:border-accent-500 focus:outline-none"
          />
        </div>

        <div className="mt-3 flex gap-2">
          {(["series", "users"] as Tab[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`tap-none min-h-[34px] flex-1 rounded-full text-[13px] font-semibold transition-colors ${
                tab === value ? "bg-accent-600 text-white" : "bg-ink-800 text-mist-400 active:bg-ink-700"
              }`}
            >
              {value === "series" ? "Series" : "People"}
            </button>
          ))}
        </div>
      </div>

      {tab === "series" ? <SeriesResults query={debounced} /> : <UserResults query={debounced} />}
    </>
  );
}
