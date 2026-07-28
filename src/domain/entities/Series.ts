import type { EpisodeStub } from "./Airing";

export type SeasonMeta = {
  seasonNumber: number;
  episodeCount: number;
  name: string;
  airDate: string | null;
  posterPath: string | null;
};

export type SeriesSummary = {
  tmdbId: number;
  name: string;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirDate: string | null;
  voteAverage: number | null;
};

export type SeriesDetail = SeriesSummary & {
  lastAirDate: string | null;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  genres: string[];
  tmdbStatus: string | null;
  inProduction: boolean;
  lastEpisodeToAir: EpisodeStub | null;
  nextEpisodeToAir: EpisodeStub | null;
  seasonsMeta: SeasonMeta[];
  episodeRunTime: number[];
  backdrops: string[];
};

export function releaseYear(series: Pick<SeriesSummary, "firstAirDate">): string | null {
  if (!series.firstAirDate) {
    return null;
  }
  return series.firstAirDate.slice(0, 4);
}
