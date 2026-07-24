import type { SeriesProgress } from "./Progress";
import { summarizeRatings, type RatingSummary } from "./RatingSummary";
import type { SeriesStatus } from "./SeriesStatus";

export type GenreCount = { genre: string; count: number };

type InsightsInput = Pick<
  SeriesProgress,
  "status" | "watchedEpisodes" | "episodeRuntime" | "isFavorite" | "rewatchCount" | "genres" | "userRating"
>;

export type LibraryInsights<T extends InsightsInput = SeriesProgress> = {
  seriesTracked: number;
  episodesWatched: number;
  watchTimeMinutes: number;
  finished: number;
  favorites: number;
  rewatches: number;
  statusCounts: Record<SeriesStatus, number>;
  topGenres: GenreCount[];
  ratings: RatingSummary;
  mostWatched: T | null;
};

export function computeLibraryInsights<T extends InsightsInput>(items: T[]): LibraryInsights<T> {
  const statusCounts: Record<SeriesStatus, number> = {
    watching: 0,
    want_to_watch: 0,
    watched: 0,
    abandoned: 0,
  };

  const genreMap = new Map<string, number>();
  const ratingBuckets = new Map<number, number>();
  let episodesWatched = 0;
  let watchTimeMinutes = 0;
  let favorites = 0;
  let rewatches = 0;
  let mostWatched: T | null = null;

  for (const item of items) {
    statusCounts[item.status] += 1;
    episodesWatched += item.watchedEpisodes;
    watchTimeMinutes += item.watchedEpisodes * item.episodeRuntime;
    if (item.isFavorite) favorites += 1;
    rewatches += item.rewatchCount;

    for (const genre of item.genres) {
      genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1);
    }

    if (item.userRating !== null) {
      ratingBuckets.set(item.userRating, (ratingBuckets.get(item.userRating) ?? 0) + 1);
    }

    if (item.watchedEpisodes > 0 && (!mostWatched || item.watchedEpisodes > mostWatched.watchedEpisodes)) {
      mostWatched = item;
    }
  }

  const topGenres = [...genreMap.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre))
    .slice(0, 8);

  return {
    seriesTracked: items.length,
    episodesWatched,
    watchTimeMinutes,
    finished: statusCounts.watched,
    favorites,
    rewatches,
    statusCounts,
    topGenres,
    ratings: summarizeRatings([...ratingBuckets.entries()].map(([rating, count]) => ({ rating, count }))),
    mostWatched,
  };
}
