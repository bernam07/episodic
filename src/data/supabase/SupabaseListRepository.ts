import { AppError } from "@/core/errors/AppError";
import type { ListDetail, ListInput, ListItem, ListSummary } from "@/domain/entities/List";
import type { IListRepository } from "@/domain/repositories/IListRepository";
import { supabase } from "./client";

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    throw new AppError("auth", "You need to be signed in.");
  }

  return data.session.user.id;
}

export class SupabaseListRepository implements IListRepository {
  async getUserLists(userId: string): Promise<ListSummary[]> {
    const { data, error } = await supabase.rpc("get_user_lists", { p_user_id: userId });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      isPrivate: row.is_private,
      itemCount: row.item_count,
      updatedAt: row.updated_at,
      posterPaths: row.poster_paths ?? [],
    }));
  }

  async getList(listId: string): Promise<ListDetail | null> {
    const { data, error } = await supabase.rpc("get_list", { p_list_id: listId });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    const row = (data ?? [])[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      isPrivate: row.is_private,
      itemCount: row.item_count,
      updatedAt: row.updated_at,
      ownerId: row.owner_id,
      ownerUsername: row.owner_username,
      ownerDisplayName: row.owner_display_name,
      ownerAvatarUrl: row.owner_avatar_url,
      isOwn: row.is_own,
    };
  }

  async getListItems(listId: string): Promise<ListItem[]> {
    const { data, error } = await supabase.rpc("get_list_items", { p_list_id: listId });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return (data ?? []).map((row) => ({
      seriesId: row.series_id,
      tmdbId: row.tmdb_id,
      seriesName: row.series_name,
      posterPath: row.poster_path,
      addedAt: row.added_at,
    }));
  }

  async createList(input: ListInput): Promise<string> {
    const userId = await currentUserId();

    const { data, error } = await supabase
      .from("lists")
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        is_private: input.isPrivate,
      })
      .select("id")
      .single();

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return data.id;
  }

  async updateList(listId: string, input: ListInput): Promise<void> {
    const { error } = await supabase
      .from("lists")
      .update({ title: input.title, description: input.description, is_private: input.isPrivate })
      .eq("id", listId);

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }

  async deleteList(listId: string): Promise<void> {
    const { error } = await supabase.from("lists").delete().eq("id", listId);

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }

  async addItem(listId: string, seriesId: string): Promise<void> {
    const { error } = await supabase
      .from("list_items")
      .upsert({ list_id: listId, series_id: seriesId }, { onConflict: "list_id,series_id", ignoreDuplicates: true });

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }

  async removeItem(listId: string, seriesId: string): Promise<void> {
    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("list_id", listId)
      .eq("series_id", seriesId);

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }
}
