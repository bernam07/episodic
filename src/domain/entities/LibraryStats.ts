import type { SeriesProgress } from "./Progress";

export type LibraryStats = {
  episodesWatched: number;
  seriesTracked: number;
  finished: number;
  favorites: number;
  averageRating: number | null;
};

type StatsInput = Pick<SeriesProgress, "status" | "watchedEpisodes" | "userRating" | "isFavorite">;

export function computeLibraryStats(items: StatsInput[]): LibraryStats {
  const rated = items.filter((item) => item.userRating !== null);
  const ratingSum = rated.reduce((sum, item) => sum + (item.userRating ?? 0), 0);

  return {
    episodesWatched: items.reduce((sum, item) => sum + item.watchedEpisodes, 0),
    seriesTracked: items.length,
    finished: items.filter((item) => item.status === "watched").length,
    favorites: items.filter((item) => item.isFavorite).length,
    averageRating: rated.length > 0 ? Math.round((ratingSum / rated.length) * 10) / 10 : null,
  };
}
