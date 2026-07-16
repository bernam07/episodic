import { AppError } from "@/core/errors/AppError";
import type {
  FeedItem,
  ProfileSearchResult,
  ProfileSummary,
  UserLibraryItem,
} from "@/domain/entities/Social";
import type { ISocialRepository } from "@/domain/repositories/ISocialRepository";
import { supabase } from "./client";

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    throw new AppError("auth", "You need to be signed in.");
  }

  return data.session.user.id;
}

export class SupabaseSocialRepository implements ISocialRepository {
  async searchProfiles(query: string, limit = 20): Promise<ProfileSearchResult[]> {
    const { data, error } = await supabase.rpc("search_profiles", {
      p_query: query,
      p_limit: limit,
    });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      followersCount: row.followers_count,
      followingCount: row.following_count,
      seriesCount: row.series_count,
      isFollowing: row.is_following,
    }));
  }

  async getProfileSummary(username: string): Promise<ProfileSummary | null> {
    const { data, error } = await supabase.rpc("get_profile_summary", { p_username: username });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    const row = (data ?? [])[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      followersCount: row.followers_count,
      followingCount: row.following_count,
      seriesCount: row.series_count,
      episodesWatched: row.episodes_watched,
      reviewsCount: row.reviews_count,
      isFollowing: row.is_following,
      isSelf: row.is_self,
    };
  }

  async getFollowingFeed(limit = 40): Promise<FeedItem[]> {
    const { data, error } = await supabase.rpc("get_following_feed", { p_limit: limit });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map((row) => ({
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      seriesId: row.series_id,
      tmdbId: row.tmdb_id,
      seriesName: row.series_name,
      posterPath: row.poster_path,
      status: row.status,
      rating: row.rating === null ? null : Number(row.rating),
      updatedAt: row.updated_at,
    }));
  }

  async getUserLibrary(userId: string, limit = 60): Promise<UserLibraryItem[]> {
    const { data, error } = await supabase.rpc("get_user_library", {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map((row) => ({
      seriesId: row.series_id,
      tmdbId: row.tmdb_id,
      seriesName: row.series_name,
      posterPath: row.poster_path,
      status: row.status,
      rating: row.rating === null ? null : Number(row.rating),
      updatedAt: row.updated_at,
    }));
  }

  async follow(userId: string): Promise<void> {
    const followerId = await currentUserId();

    const { error } = await supabase
      .from("follows")
      .upsert({ follower_id: followerId, following_id: userId }, { onConflict: "follower_id,following_id" });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }

  async unfollow(userId: string): Promise<void> {
    const followerId = await currentUserId();

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", userId);

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("username_available", { p_username: username });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return data === true;
  }
}
