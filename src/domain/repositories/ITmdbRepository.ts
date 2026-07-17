import type { CastMember } from "../entities/Cast";
import type { Season } from "../entities/Episode";
import type { SeriesDetail, SeriesSummary } from "../entities/Series";

export type SearchResult = {
  page: number;
  totalPages: number;
  results: SeriesSummary[];
};

export type Genre = {
  id: number;
  name: string;
};

export interface ITmdbRepository {
  search(query: string, page?: number): Promise<SearchResult>;
  trending(page?: number): Promise<SearchResult>;
  getGenres(): Promise<Genre[]>;
  discoverByGenre(genreId: number | null, page?: number): Promise<SearchResult>;
  getRecommendations(tmdbId: number, page?: number): Promise<SearchResult>;
  getSeriesDetail(tmdbId: number): Promise<SeriesDetail>;
  getSeason(tmdbId: number, seasonNumber: number): Promise<Season>;
  getCredits(tmdbId: number): Promise<CastMember[]>;
}
