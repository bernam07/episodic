import type { SeriesDetail } from "../entities/Series";

export interface ISeriesRepository {
  cacheSeries(detail: SeriesDetail): Promise<string>;
  findLocalIdByTmdbId(tmdbId: number): Promise<string | null>;
}
