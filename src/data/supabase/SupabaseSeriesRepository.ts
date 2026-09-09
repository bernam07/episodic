import { AppError } from "@/core/errors/AppError";
import { airedEpisodeCount } from "@/domain/entities/Airing";
import type { SeriesDetail } from "@/domain/entities/Series";
import type { ISeriesRepository } from "@/domain/repositories/ISeriesRepository";
import { supabase } from "./client";

export class SupabaseSeriesRepository implements ISeriesRepository {
  async cacheSeries(detail: SeriesDetail, airedEpisodes?: number): Promise<string> {
    const payload = {
      tmdb_id: detail.tmdbId,
      name: detail.name,
      overview: detail.overview,
      poster_path: detail.posterPath,
      backdrop_path: detail.backdropPath,
      first_air_date: detail.firstAirDate,
      last_air_date: detail.lastAirDate,
      number_of_seasons: detail.numberOfSeasons,
      number_of_episodes: detail.numberOfEpisodes,
      aired_episodes: Math.max(airedEpisodeCount(detail), airedEpisodes ?? 0),
      episode_runtime:
        detail.episodeRunTime.length > 0
          ? Math.round(detail.episodeRunTime.reduce((sum, value) => sum + value, 0) / detail.episodeRunTime.length)
          : 0,
      vote_average: detail.voteAverage,
      genres: detail.genres,
      tmdb_status: detail.tmdbStatus,
      seasons_meta: detail.seasonsMeta.map((season) => ({
        season_number: season.seasonNumber,
        episode_count: season.episodeCount,
        name: season.name,
        air_date: season.airDate,
        poster_path: season.posterPath,
      })),
    };

    const { data, error } = await supabase.rpc("upsert_series_from_tmdb", { p_payload: payload });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return data as string;
  }

  async findLocalIdByTmdbId(tmdbId: number): Promise<string | null> {
    const { data, error } = await supabase
      .from("series")
      .select("id")
      .eq("tmdb_id", tmdbId)
      .maybeSingle();

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return data?.id ?? null;
  }
}
