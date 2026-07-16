import type { Season } from "../entities/Episode";
import type { SeriesDetail, SeriesSummary } from "../entities/Series";

export type SearchResult = {
  page: number;
  totalPages: number;
  results: SeriesSummary[];
};

export interface ITmdbRepository {
  search(query: string, page?: number): Promise<SearchResult>;
  trending(page?: number): Promise<SearchResult>;
  getSeriesDetail(tmdbId: number): Promise<SeriesDetail>;
  getSeason(tmdbId: number, seasonNumber: number): Promise<Season>;
}
