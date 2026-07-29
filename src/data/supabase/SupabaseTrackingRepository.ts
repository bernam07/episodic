import { AppError } from "@/core/errors/AppError";
import type {
  ContinueWatchingItem,
  UpNextItem,
  SeasonProgress,
  SeriesProgress,
  WatchedEpisodeRef,
} from "@/domain/entities/Progress";
import type { SeriesStatus, UserSeriesStatus } from "@/domain/entities/SeriesStatus";
import type { ITrackingRepository } from "@/domain/repositories/ITrackingRepository";
import { supabase } from "./client";

type ProgressRow = {
  series_id: string;
  tmdb_id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  status: SeriesStatus;
  is_favorite: boolean;
  favorite_pinned_at: string | null;
  rewatch_count: number;
  number_of_seasons: number;
  number_of_episodes: number;
  aired_episodes: number;
  episode_runtime: number;
  genres: string[];
  watched_episodes: number;
  remaining_episodes: number;
  progress_percent: number;
  user_rating: number | null;
  updated_at: string;
};

function toProgress(row: ProgressRow): SeriesProgress {
  return {
    seriesId: row.series_id,
    tmdbId: row.tmdb_id,
    name: row.name,
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    status: row.status,
    isFavorite: row.is_favorite,
    favoritePinnedAt: row.favorite_pinned_at ?? null,
    rewatchCount: row.rewatch_count,
    numberOfSeasons: row.number_of_seasons,
    numberOfEpisodes: row.number_of_episodes,
    airedEpisodes: row.aired_episodes ?? 0,
    episodeRuntime: row.episode_runtime ?? 0,
    genres: row.genres ?? [],
    watchedEpisodes: row.watched_episodes,
    remainingEpisodes: row.remaining_episodes,
    progressPercent: Number(row.progress_percent),
    userRating: row.user_rating === null ? null : Number(row.user_rating),
    updatedAt: row.updated_at,
  };
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    throw new AppError("auth", "You need to be signed in.");
  }

  return data.session.user.id;
}

export class SupabaseTrackingRepository implements ITrackingRepository {
  async getLibrary(status?: SeriesStatus): Promise<SeriesProgress[]> {
    const userId = await currentUserId();

    let query = supabase
      .from("user_series_progress")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data as unknown as ProgressRow[]).map(toProgress);
  }

  async getSeriesProgress(seriesId: string): Promise<SeriesProgress | null> {
    const userId = await currentUserId();

    const { data, error } = await supabase
      .from("user_series_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("series_id", seriesId)
      .maybeSingle();

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return data ? toProgress(data as unknown as ProgressRow) : null;
  }

  async getStatus(seriesId: string): Promise<UserSeriesStatus | null> {
    const userId = await currentUserId();

    const { data, error } = await supabase
      .from("user_series_status")
      .select("*")
      .eq("user_id", userId)
      .eq("series_id", seriesId)
      .maybeSingle();

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    if (!data) {
      return null;
    }

    const row = data as unknown as Record<string, unknown>;

    return {
      id: row.id as string,
      userId: row.user_id as string,
      seriesId: row.series_id as string,
      status: row.status as SeriesStatus,
      isFavorite: row.is_favorite as boolean,
      rewatchCount: (row.rewatch_count as number) ?? 0,
      rating: (row.rating as number | null) ?? null,
      startedAt: row.started_at as string | null,
      completedAt: row.completed_at as string | null,
    };
  }

  async setStatus(seriesId: string, status: SeriesStatus): Promise<void> {
    const userId = await currentUserId();

    const { error } = await supabase
      .from("user_series_status")
      .upsert({ user_id: userId, series_id: seriesId, status }, { onConflict: "user_id,series_id" });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }

  async removeFromLibrary(seriesId: string): Promise<void> {
    const userId = await currentUserId();

    const { error: trackingError } = await supabase
      .from("episode_tracking")
      .delete()
      .eq("series_id", seriesId)
      .eq("user_id", userId);

    if (trackingError) {
      throw new AppError("unknown", trackingError.message, trackingError);
    }

    const { error } = await supabase
      .from("user_series_status")
      .delete()
      .eq("series_id", seriesId)
      .eq("user_id", userId);

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }

  async getSeasonProgress(seriesId: string): Promise<SeasonProgress[]> {
    const { data, error } = await supabase.rpc("get_season_progress", { p_series_id: seriesId });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map((row) => ({
      seasonNumber: row.season_number,
      totalEpisodes: row.total_episodes,
      watchedEpisodes: row.watched_episodes,
      progressPercent: Number(row.progress_percent),
    }));
  }

  async getWatchedEpisodes(seriesId: string): Promise<number[]> {
    const { data, error } = await supabase
      .from("episode_tracking")
      .select("tmdb_episode_id")
      .eq("series_id", seriesId);

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map((row) => row.tmdb_episode_id);
  }

  async markEpisode(seriesId: string, episode: WatchedEpisodeRef): Promise<void> {
    const userId = await currentUserId();

    const { error } = await supabase.from("episode_tracking").upsert(
      {
        user_id: userId,
        series_id: seriesId,
        tmdb_episode_id: episode.tmdbEpisodeId,
        season_number: episode.seasonNumber,
        episode_number: episode.episodeNumber,
      },
      { onConflict: "user_id,tmdb_episode_id", ignoreDuplicates: true }
    );

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }

  async unmarkEpisode(tmdbEpisodeId: number): Promise<void> {
    const userId = await currentUserId();

    const { error } = await supabase
      .from("episode_tracking")
      .delete()
      .eq("tmdb_episode_id", tmdbEpisodeId)
      .eq("user_id", userId);

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }

  async setSeasonWatched(
    seriesId: string,
    seasonNumber: number,
    episodes: Pick<WatchedEpisodeRef, "tmdbEpisodeId" | "episodeNumber">[],
    watched: boolean
  ): Promise<number> {
    const { data, error } = await supabase.rpc("set_season_watched", {
      p_series_id: seriesId,
      p_season_number: seasonNumber,
      p_episodes: episodes.map((episode) => ({
        tmdb_episode_id: episode.tmdbEpisodeId,
        episode_number: episode.episodeNumber,
      })),
      p_watched: watched,
    });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return data ?? 0;
  }

  async setSeriesWatched(seriesId: string, episodes: WatchedEpisodeRef[]): Promise<number> {
    if (episodes.length === 0) {
      return 0;
    }

    const { data, error } = await supabase.rpc("set_series_watched", {
      p_series_id: seriesId,
      p_episodes: episodes.map((episode) => ({
        tmdb_episode_id: episode.tmdbEpisodeId,
        season_number: episode.seasonNumber,
        episode_number: episode.episodeNumber,
      })),
    });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return data ?? 0;
  }

  async clearSeriesEpisodes(seriesId: string): Promise<number> {
    const { data, error } = await supabase.rpc("clear_series_episodes", {
      p_series_id: seriesId,
    });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return data ?? 0;
  }

  async toggleFavorite(seriesId: string): Promise<void> {
    const { error } = await supabase.rpc("toggle_favorite", { p_series_id: seriesId });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }

  async setFavoritePinned(seriesId: string, pinned: boolean): Promise<void> {
    const { error } = await supabase.rpc("set_favorite_pinned" as never, {
      p_series_id: seriesId,
      p_pinned: pinned,
    } as never);

    if (error) {
      const message = (error as { message: string }).message;
      throw new AppError(message.includes("pin_limit_reached") ? "validation" : "unknown", message, error);
    }
  }

  async setRating(seriesId: string, rating: number | null): Promise<void> {
    const { error } = await supabase.rpc("set_rating" as never, {
      p_series_id: seriesId,
      p_rating: rating,
    } as never);

    if (error) {
      throw new AppError("unknown", (error as { message: string }).message, error);
    }
  }

  async reorderFavorites(seriesIds: string[]): Promise<void> {
    const { error } = await supabase.rpc("reorder_favorites" as never, {
      p_series_ids: seriesIds,
    } as never);

    if (error) {
      throw new AppError("unknown", (error as { message: string }).message, error);
    }
  }

  async getWatchStreak(): Promise<number> {
    const { data, error } = await supabase.rpc("get_watch_streak" as never);

    if (error) {
      throw new AppError("unknown", (error as { message: string }).message, error);
    }

    return (data as number | null) ?? 0;
  }

  async bumpRewatch(seriesId: string, delta: number): Promise<number> {
    const { data, error } = await supabase.rpc("bump_rewatch", {
      p_series_id: seriesId,
      p_delta: delta,
    });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return data ?? 0;
  }

  async getContinueWatching(limit = 10): Promise<ContinueWatchingItem[]> {
    const { data, error } = await supabase.rpc("get_continue_watching", { p_limit: limit });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map((row) => ({
      seriesId: row.series_id,
      tmdbId: row.tmdb_id,
      name: row.name,
      posterPath: row.poster_path,
      watchedEpisodes: row.watched_episodes,
      numberOfEpisodes: row.number_of_episodes,
      progressPercent: Number(row.progress_percent),
      lastWatchedAt: row.last_watched_at,
    }));
  }

  async getUpNext(limit = 20): Promise<UpNextItem[]> {
    const { data, error } = await supabase.rpc("get_up_next", { p_limit: limit });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map((row) => ({
      seriesId: row.series_id,
      tmdbId: row.tmdb_id,
      name: row.name,
      posterPath: row.poster_path,
      nextSeason: row.next_season,
      nextEpisode: row.next_episode,
      watchedEpisodes: row.watched_episodes,
      airedEpisodes: row.aired_episodes,
      numberOfEpisodes: row.number_of_episodes,
      lastWatchedAt: row.last_watched_at,
    }));
  }
}
