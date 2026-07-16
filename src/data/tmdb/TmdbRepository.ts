import { AppError } from "@/core/errors/AppError";
import type { EpisodeStub } from "@/domain/entities/Airing";
import type { Episode, Season } from "@/domain/entities/Episode";
import type { SeriesDetail, SeriesSummary } from "@/domain/entities/Series";
import type { Genre, ITmdbRepository, SearchResult } from "@/domain/repositories/ITmdbRepository";
import { supabase } from "../supabase/client";

type RawSummary = {
  tmdb_id: number;
  name: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  vote_average: number | null;
};

type RawEpisodeStub = {
  tmdb_episode_id: number;
  season_number: number;
  episode_number: number;
  name: string;
  air_date: string | null;
};

type RawDetail = RawSummary & {
  last_air_date: string | null;
  number_of_seasons: number;
  number_of_episodes: number;
  genres: string[];
  tmdb_status: string | null;
  in_production: boolean;
  last_episode_to_air: RawEpisodeStub | null;
  next_episode_to_air: RawEpisodeStub | null;
  seasons_meta: {
    season_number: number;
    episode_count: number;
    name: string;
    air_date: string | null;
    poster_path: string | null;
  }[];
};

type RawEpisode = {
  tmdb_episode_id: number;
  season_number: number;
  episode_number: number;
  name: string;
  overview: string | null;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number | null;
};

type RawSeason = {
  season_number: number;
  name: string;
  overview: string | null;
  poster_path: string | null;
  air_date: string | null;
  episodes: RawEpisode[];
};

type RawSearch = {
  page: number;
  total_pages: number;
  results: RawSummary[];
};

function toSummary(raw: RawSummary): SeriesSummary {
  return {
    tmdbId: raw.tmdb_id,
    name: raw.name,
    overview: raw.overview,
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    firstAirDate: raw.first_air_date,
    voteAverage: raw.vote_average,
  };
}

function toEpisodeStub(raw: RawEpisodeStub | null): EpisodeStub | null {
  if (!raw) {
    return null;
  }

  return {
    tmdbEpisodeId: raw.tmdb_episode_id,
    seasonNumber: raw.season_number,
    episodeNumber: raw.episode_number,
    name: raw.name,
    airDate: raw.air_date,
  };
}

function toDetail(raw: RawDetail): SeriesDetail {
  return {
    ...toSummary(raw),
    lastAirDate: raw.last_air_date,
    numberOfSeasons: raw.number_of_seasons,
    numberOfEpisodes: raw.number_of_episodes,
    genres: raw.genres ?? [],
    tmdbStatus: raw.tmdb_status,
    inProduction: raw.in_production ?? false,
    lastEpisodeToAir: toEpisodeStub(raw.last_episode_to_air ?? null),
    nextEpisodeToAir: toEpisodeStub(raw.next_episode_to_air ?? null),
    seasonsMeta: (raw.seasons_meta ?? []).map((season) => ({
      seasonNumber: season.season_number,
      episodeCount: season.episode_count,
      name: season.name,
      airDate: season.air_date,
      posterPath: season.poster_path,
    })),
  };
}

function toEpisode(raw: RawEpisode): Episode {
  return {
    tmdbEpisodeId: raw.tmdb_episode_id,
    seasonNumber: raw.season_number,
    episodeNumber: raw.episode_number,
    name: raw.name,
    overview: raw.overview,
    stillPath: raw.still_path,
    airDate: raw.air_date,
    runtime: raw.runtime,
    voteAverage: raw.vote_average,
  };
}

export class TmdbRepository implements ITmdbRepository {
  private async invoke<T>(path: string): Promise<T> {
    const { data, error } = await supabase.functions.invoke<T>(`tmdb/${path}`, { method: "GET" });

    if (error) {
      throw new AppError("network", "Could not reach TMDB.", error);
    }

    if (!data) {
      throw new AppError("not_found", "No data returned from TMDB.");
    }

    return data;
  }

  async search(query: string, page = 1): Promise<SearchResult> {
    const raw = await this.invoke<RawSearch>(
      `search?q=${encodeURIComponent(query)}&page=${page}`
    );

    return { page: raw.page, totalPages: raw.total_pages, results: raw.results.map(toSummary) };
  }

  async trending(page = 1): Promise<SearchResult> {
    const raw = await this.invoke<RawSearch>(`trending?page=${page}`);

    return { page: raw.page, totalPages: raw.total_pages, results: raw.results.map(toSummary) };
  }

  async getGenres(): Promise<Genre[]> {
    const raw = await this.invoke<{ genres: Genre[] }>("genres");
    return raw.genres ?? [];
  }

  async discoverByGenre(genreId: number | null, page = 1): Promise<SearchResult> {
    const query = genreId === null ? `discover?page=${page}` : `discover?genre=${genreId}&page=${page}`;
    const raw = await this.invoke<RawSearch>(query);

    return { page: raw.page, totalPages: raw.total_pages, results: raw.results.map(toSummary) };
  }

  async getRecommendations(tmdbId: number, page = 1): Promise<SearchResult> {
    const raw = await this.invoke<RawSearch>(`series/${tmdbId}/recommendations?page=${page}`);

    return { page: raw.page, totalPages: raw.total_pages, results: raw.results.map(toSummary) };
  }

  async getSeriesDetail(tmdbId: number): Promise<SeriesDetail> {
    return toDetail(await this.invoke<RawDetail>(`series/${tmdbId}`));
  }

  async getSeason(tmdbId: number, seasonNumber: number): Promise<Season> {
    const raw = await this.invoke<RawSeason>(`series/${tmdbId}/season/${seasonNumber}`);

    return {
      seasonNumber: raw.season_number,
      name: raw.name,
      overview: raw.overview,
      posterPath: raw.poster_path,
      airDate: raw.air_date,
      episodes: (raw.episodes ?? []).map(toEpisode),
    };
  }
}
