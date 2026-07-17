import type { CastMember } from "@/domain/entities/Cast";
import type { Season } from "@/domain/entities/Episode";
import type { SeriesDetail } from "@/domain/entities/Series";
import type { Genre, ITmdbRepository, SearchResult } from "@/domain/repositories/ITmdbRepository";

const MIN_QUERY_LENGTH = 2;

export class SearchSeries {
  constructor(private readonly tmdb: ITmdbRepository) {}

  async execute(query: string, page = 1): Promise<SearchResult> {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      return { page: 1, totalPages: 0, results: [] };
    }

    return this.tmdb.search(trimmed, page);
  }
}

export class GetTrending {
  constructor(private readonly tmdb: ITmdbRepository) {}

  async execute(page = 1): Promise<SearchResult> {
    return this.tmdb.trending(page);
  }
}

export class GetGenres {
  constructor(private readonly tmdb: ITmdbRepository) {}

  async execute(): Promise<Genre[]> {
    return this.tmdb.getGenres();
  }
}

export class DiscoverByGenre {
  constructor(private readonly tmdb: ITmdbRepository) {}

  async execute(genreId: number | null, page = 1): Promise<SearchResult> {
    return this.tmdb.discoverByGenre(genreId, page);
  }
}

export class GetRecommendations {
  constructor(private readonly tmdb: ITmdbRepository) {}

  async execute(tmdbId: number, page = 1): Promise<SearchResult> {
    return this.tmdb.getRecommendations(tmdbId, page);
  }
}

export class GetSeriesDetail {
  constructor(private readonly tmdb: ITmdbRepository) {}

  async execute(tmdbId: number): Promise<SeriesDetail> {
    return this.tmdb.getSeriesDetail(tmdbId);
  }
}

export class GetSeason {
  constructor(private readonly tmdb: ITmdbRepository) {}

  async execute(tmdbId: number, seasonNumber: number): Promise<Season> {
    return this.tmdb.getSeason(tmdbId, seasonNumber);
  }
}

export class GetCredits {
  constructor(private readonly tmdb: ITmdbRepository) {}

  async execute(tmdbId: number): Promise<CastMember[]> {
    return this.tmdb.getCredits(tmdbId);
  }
}
