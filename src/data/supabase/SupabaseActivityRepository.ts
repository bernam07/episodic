import { AppError } from "@/core/errors/AppError";
import type { ActivityEvent, ActivityEventType } from "@/domain/entities/Activity";
import type { IActivityRepository } from "@/domain/repositories/IActivityRepository";
import { supabase } from "./client";

type ActivityRow = {
  actor_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  event_type: string;
  series_id: string;
  tmdb_id: number;
  series_name: string;
  poster_path: string | null;
  occurred_at: string;
  episode_count: number | null;
  rating: number | null;
  review_body: string | null;
};

function toActivityEvent(row: ActivityRow): ActivityEvent {
  return {
    actorId: row.actor_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    eventType: row.event_type as ActivityEventType,
    seriesId: row.series_id,
    tmdbId: row.tmdb_id,
    seriesName: row.series_name,
    posterPath: row.poster_path,
    occurredAt: row.occurred_at,
    episodeCount: row.episode_count,
    rating: row.rating === null ? null : Number(row.rating),
    reviewBody: row.review_body,
  };
}

export class SupabaseActivityRepository implements IActivityRepository {
  async getFriendsFeed(limit = 40): Promise<ActivityEvent[]> {
    const { data, error } = await supabase.rpc("get_friends_feed", { p_limit: limit });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map(toActivityEvent);
  }

  async getUserDiary(userId: string, limit = 40): Promise<ActivityEvent[]> {
    const { data, error } = await supabase.rpc("get_user_diary", {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map(toActivityEvent);
  }
}
