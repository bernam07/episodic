import { AppError } from "@/core/errors/AppError";
import type { AppNotification } from "@/domain/entities/Notification";
import type { INotificationRepository } from "@/domain/repositories/INotificationRepository";
import { supabase } from "./client";

export class SupabaseNotificationRepository implements INotificationRepository {
  async getNotifications(limit = 50): Promise<AppNotification[]> {
    const { data, error } = await supabase.rpc("get_notifications", { p_limit: limit });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      type: row.type,
      read: row.read,
      createdAt: row.created_at,
      actorId: row.actor_id,
      actorUsername: row.actor_username,
      actorDisplayName: row.actor_display_name,
      actorAvatarUrl: row.actor_avatar_url,
      seriesId: row.series_id,
      seriesTmdbId: row.series_tmdb_id,
      seriesName: row.series_name,
      seriesPosterPath: row.series_poster_path,
    }));
  }

  async getUnreadCount(): Promise<number> {
    const { data, error } = await supabase.rpc("get_unread_notification_count");

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return data ?? 0;
  }

  async markAllRead(): Promise<void> {
    const { error } = await supabase.rpc("mark_notifications_read");

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }
}
