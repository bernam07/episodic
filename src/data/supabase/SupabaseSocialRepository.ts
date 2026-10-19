import { AppError } from "@/core/errors/AppError";
import type { ComparisonItem } from "@/domain/entities/Comparison";
import type {
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

type ProfileSearchRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
  series_count: number;
  is_following: boolean;
};

function toProfileSearchResult(row: ProfileSearchRow): ProfileSearchResult {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    followersCount: row.followers_count,
    followingCount: row.following_count,
    seriesCount: row.series_count,
    isFollowing: row.is_following,
  };
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

    return (data ?? []).map(toProfileSearchResult);
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
      ...toProfileSearchResult(row),
      bannerUrl: (row as { banner_url?: string | null }).banner_url ?? null,
      bio: row.bio,
      episodesWatched: row.episodes_watched,
      reviewsCount: row.reviews_count,
      isSelf: row.is_self,
    };
  }

  async getFollowers(username: string, limit = 60): Promise<ProfileSearchResult[]> {
    const { data, error } = await supabase.rpc("get_followers", {
      p_username: username,
      p_limit: limit,
    });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map(toProfileSearchResult);
  }

  async getFollowing(username: string, limit = 60): Promise<ProfileSearchResult[]> {
    const { data, error } = await supabase.rpc("get_following", {
      p_username: username,
      p_limit: limit,
    });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map(toProfileSearchResult);
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
      isFavorite: row.is_favorite,
      rating: row.rating === null ? null : Number(row.rating),
      updatedAt: row.updated_at,
    }));
  }

  async getUserFavorites(userId: string, limit = 60): Promise<UserLibraryItem[]> {
    const { data, error } = await supabase.rpc("get_user_favorites", {
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
      isFavorite: true,
      rating: row.rating === null ? null : Number(row.rating),
      updatedAt: row.updated_at,
    }));
  }

  async compareLibraries(otherUserId: string): Promise<ComparisonItem[]> {
    const { data, error } = await supabase.rpc("compare_libraries" as never, {
      p_other_user_id: otherUserId,
    } as never);

    if (error) {
      throw new AppError("unknown", (error as { message: string }).message, error);
    }

    type ComparisonRow = {
      tmdb_id: number;
      series_name: string;
      poster_path: string | null;
      genres: string[];
      my_status: string | null;
      my_rating: number | null;
      their_status: string | null;
      their_rating: number | null;
    };

    return ((data ?? []) as ComparisonRow[]).map((row) => ({
      tmdbId: row.tmdb_id,
      seriesName: row.series_name,
      posterPath: row.poster_path,
      genres: row.genres ?? [],
      myStatus: (row.my_status as ComparisonItem["myStatus"]) ?? null,
      myRating: row.my_rating === null ? null : Number(row.my_rating),
      theirStatus: (row.their_status as ComparisonItem["theirStatus"]) ?? null,
      theirRating: row.their_rating === null ? null : Number(row.their_rating),
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
