import { Link } from "react-router-dom";
import { releaseYear } from "@/domain/entities/Series";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useTrending } from "@/presentation/hooks/useDiscovery";
import { useContinueWatching } from "@/presentation/hooks/useTracking";
import { ScreenHeader } from "@/presentation/layout/ScreenHeader";
import { useAuth } from "@/presentation/hooks/useAuth";

function ContinueWatchingRow() {
  const { data, isLoading } = useContinueWatching();

  if (isLoading) {
    return (
      <div className="flex h-28 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        Continue Watching
      </h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {data.map((item) => (
          <Link
            key={item.seriesId}
            to={`/series/${item.tmdbId}`}
            className="tap-none w-[132px] shrink-0 active:opacity-70"
          >
            <SeriesPoster path={item.posterPath} alt={item.name} size="w342" />
            <p className="mt-2 truncate text-[13px] font-semibold text-mist-100">{item.name}</p>
            <p className="mt-0.5 text-[11px] text-mist-400 tabular-nums">
              {item.watchedEpisodes}/{item.numberOfEpisodes} episodes
            </p>
            <ProgressBar value={item.progressPercent} className="mt-1.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function TrendingGrid() {
  const { data, isLoading, isError } = useTrending();

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="px-5 text-[14px] text-mist-400">Could not load trending series right now.</p>
    );
  }

  return (
    <section>
      <h2 className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        Trending This Week
      </h2>
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
    </section>
  );
}

export function HomeScreen() {
  const { profile } = useAuth();
  const greeting = profile?.displayName || profile?.username;

  return (
    <>
      <ScreenHeader title="Episodic" subtitle={greeting ? `Welcome back, ${greeting}` : undefined} />
      <ContinueWatchingRow />
      <TrendingGrid />
    </>
  );
}
