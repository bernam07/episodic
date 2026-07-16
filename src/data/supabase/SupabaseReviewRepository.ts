import { AppError } from "@/core/errors/AppError";
import type { Review } from "@/domain/entities/Review";
import type { IReviewRepository, SubmitReviewInput } from "@/domain/repositories/IReviewRepository";
import { supabase } from "./client";

const SELECT_WITH_AUTHOR = `
  id, user_id, series_id, rating, body, contains_spoilers, created_at,
  profiles ( username, display_name, avatar_url ),
  series ( tmdb_id, name, poster_path )
`;

type ReviewRow = {
  id: string;
  user_id: string;
  series_id: string;
  rating: number;
  body: string | null;
  contains_spoilers: boolean;
  created_at: string;
  profiles?: { username: string; display_name: string | null; avatar_url: string | null } | null;
  series?: { tmdb_id: number; name: string; poster_path: string | null } | null;
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    userId: row.user_id,
    seriesId: row.series_id,
    rating: Number(row.rating),
    body: row.body,
    containsSpoilers: row.contains_spoilers,
    createdAt: row.created_at,
    author: row.profiles
      ? {
          username: row.profiles.username,
          displayName: row.profiles.display_name,
          avatarUrl: row.profiles.avatar_url,
        }
      : undefined,
    series: row.series
      ? {
          tmdbId: row.series.tmdb_id,
          name: row.series.name,
          posterPath: row.series.poster_path,
        }
      : undefined,
  };
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    throw new AppError("auth", "You need to be signed in.");
  }

  return data.session.user.id;
}

export class SupabaseReviewRepository implements IReviewRepository {
  async getForSeries(seriesId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select(SELECT_WITH_AUTHOR)
      .eq("series_id", seriesId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data as unknown as ReviewRow[]).map(toReview);
  }

  async getOwnForSeries(seriesId: string): Promise<Review | null> {
    const userId = await currentUserId();

    const { data, error } = await supabase
      .from("reviews")
      .select(SELECT_WITH_AUTHOR)
      .eq("series_id", seriesId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return data ? toReview(data as unknown as ReviewRow) : null;
  }

  async getOwn(): Promise<Review[]> {
    const userId = await currentUserId();

    const { data, error } = await supabase
      .from("reviews")
      .select(SELECT_WITH_AUTHOR)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data as unknown as ReviewRow[]).map(toReview);
  }

  async submit(input: SubmitReviewInput): Promise<Review> {
    const userId = await currentUserId();

    const { data, error } = await supabase
      .from("reviews")
      .upsert(
        {
          user_id: userId,
          series_id: input.seriesId,
          rating: input.rating,
          body: input.body ?? null,
          contains_spoilers: input.containsSpoilers ?? false,
        },
        { onConflict: "user_id,series_id" }
      )
      .select(SELECT_WITH_AUTHOR)
      .single();

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return toReview(data as unknown as ReviewRow);
  }

  async remove(seriesId: string): Promise<void> {
    const userId = await currentUserId();

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("series_id", seriesId)
      .eq("user_id", userId);

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }
}
