import type { SeriesStatus } from "./SeriesStatus";

export type SeriesProgress = {
  seriesId: string;
  tmdbId: number;
  name: string;
  posterPath: string | null;
  backdropPath: string | null;
  status: SeriesStatus;
  isFavorite: boolean;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  watchedEpisodes: number;
  remainingEpisodes: number;
  progressPercent: number;
  userRating: number | null;
  updatedAt: string;
};

export type SeasonProgress = {
  seasonNumber: number;
  totalEpisodes: number;
  watchedEpisodes: number;
  progressPercent: number;
};

export type ContinueWatchingItem = {
  seriesId: string;
  tmdbId: number;
  name: string;
  posterPath: string | null;
  watchedEpisodes: number;
  numberOfEpisodes: number;
  progressPercent: number;
  lastWatchedAt: string | null;
};

export type WatchedEpisodeRef = {
  tmdbEpisodeId: number;
  seasonNumber: number;
  episodeNumber: number;
};
