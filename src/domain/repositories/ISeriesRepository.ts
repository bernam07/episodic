import type { SeriesDetail } from "../entities/Series";

export interface ISeriesRepository {
  cacheSeries(detail: SeriesDetail, airedEpisodes?: number): Promise<string>;
  findLocalIdByTmdbId(tmdbId: number): Promise<string | null>;
}
