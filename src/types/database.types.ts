export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      episode_tracking: {
        Row: {
          episode_number: number
          id: string
          season_number: number
          series_id: string
          tmdb_episode_id: number
          user_id: string
          watched_at: string
        }
        Insert: {
          episode_number: number
          id?: string
          season_number: number
          series_id: string
          tmdb_episode_id: number
          user_id: string
          watched_at?: string
        }
        Update: {
          episode_number?: number
          id?: string
          season_number?: number
          series_id?: string
          tmdb_episode_id?: number
          user_id?: string
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_tracking_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episode_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          read: boolean
          series_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          read?: boolean
          series_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          read?: boolean
          series_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          contains_spoilers: boolean
          created_at: string
          id: string
          rating: number
          series_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          contains_spoilers?: boolean
          created_at?: string
          id?: string
          rating: number
          series_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          contains_spoilers?: boolean
          created_at?: string
          id?: string
          rating?: number
          series_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          backdrop_path: string | null
          created_at: string
          first_air_date: string | null
          genres: string[]
          id: string
          last_air_date: string | null
          name: string
          number_of_episodes: number
          number_of_seasons: number
          overview: string | null
          poster_path: string | null
          seasons_meta: Json
          synced_at: string
          tmdb_id: number
          tmdb_status: string | null
          updated_at: string
          vote_average: number | null
        }
        Insert: {
          backdrop_path?: string | null
          created_at?: string
          first_air_date?: string | null
          genres?: string[]
          id?: string
          last_air_date?: string | null
          name: string
          number_of_episodes?: number
          number_of_seasons?: number
          overview?: string | null
          poster_path?: string | null
          seasons_meta?: Json
          synced_at?: string
          tmdb_id: number
          tmdb_status?: string | null
          updated_at?: string
          vote_average?: number | null
        }
        Update: {
          backdrop_path?: string | null
          created_at?: string
          first_air_date?: string | null
          genres?: string[]
          id?: string
          last_air_date?: string | null
          name?: string
          number_of_episodes?: number
          number_of_seasons?: number
          overview?: string | null
          poster_path?: string | null
          seasons_meta?: Json
          synced_at?: string
          tmdb_id?: number
          tmdb_status?: string | null
          updated_at?: string
          vote_average?: number | null
        }
        Relationships: []
      }
      user_series_status: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_favorite: boolean
          series_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["series_watch_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          series_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["series_watch_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          series_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["series_watch_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_series_status_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_series_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_series_progress: {
        Row: {
          backdrop_path: string | null
          completed_at: string | null
          is_favorite: boolean | null
          name: string | null
          number_of_episodes: number | null
          number_of_seasons: number | null
          poster_path: string | null
          progress_percent: number | null
          remaining_episodes: number | null
          series_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["series_watch_status"] | null
          tmdb_id: number | null
          updated_at: string | null
          user_id: string | null
          user_rating: number | null
          watched_episodes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_series_status_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_series_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      clear_series_episodes: { Args: { p_series_id: string }; Returns: number }
      delete_own_account: { Args: never; Returns: undefined }
      generate_unique_username: { Args: { p_seed: string }; Returns: string }
      get_continue_watching: {
        Args: { p_limit?: number }
        Returns: {
          last_watched_at: string
          name: string
          number_of_episodes: number
          poster_path: string
          progress_percent: number
          series_id: string
          tmdb_id: number
          watched_episodes: number
        }[]
      }
      get_followers: {
        Args: { p_limit?: number; p_username: string }
        Returns: {
          avatar_url: string
          display_name: string
          followers_count: number
          following_count: number
          id: string
          is_following: boolean
          series_count: number
          username: string
        }[]
      }
      get_following: {
        Args: { p_limit?: number; p_username: string }
        Returns: {
          avatar_url: string
          display_name: string
          followers_count: number
          following_count: number
          id: string
          is_following: boolean
          series_count: number
          username: string
        }[]
      }
      get_following_feed: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          poster_path: string
          rating: number
          series_id: string
          series_name: string
          status: Database["public"]["Enums"]["series_watch_status"]
          tmdb_id: number
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      get_notifications: {
        Args: { p_limit?: number }
        Returns: {
          actor_avatar_url: string
          actor_display_name: string
          actor_id: string
          actor_username: string
          created_at: string
          id: string
          read: boolean
          series_id: string
          series_name: string
          series_poster_path: string
          series_tmdb_id: number
          type: Database["public"]["Enums"]["notification_type"]
        }[]
      }
      get_profile_summary: {
        Args: { p_username: string }
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          episodes_watched: number
          followers_count: number
          following_count: number
          id: string
          is_following: boolean
          is_self: boolean
          reviews_count: number
          series_count: number
          username: string
        }[]
      }
      get_season_progress: {
        Args: { p_series_id: string }
        Returns: {
          progress_percent: number
          season_number: number
          total_episodes: number
          watched_episodes: number
        }[]
      }
      get_unread_notification_count: { Args: never; Returns: number }
      get_user_library: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          is_favorite: boolean
          poster_path: string
          rating: number
          series_id: string
          series_name: string
          status: Database["public"]["Enums"]["series_watch_status"]
          tmdb_id: number
          updated_at: string
        }[]
      }
      mark_notifications_read: { Args: never; Returns: undefined }
      search_profiles: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          avatar_url: string
          display_name: string
          followers_count: number
          following_count: number
          id: string
          is_following: boolean
          series_count: number
          username: string
        }[]
      }
      set_season_watched: {
        Args: {
          p_episodes: Json
          p_season_number: number
          p_series_id: string
          p_watched: boolean
        }
        Returns: number
      }
      set_series_watched: {
        Args: { p_episodes: Json; p_series_id: string }
        Returns: number
      }
      toggle_favorite: { Args: { p_series_id: string }; Returns: undefined }
      upsert_series_from_tmdb: { Args: { p_payload: Json }; Returns: string }
      username_available: { Args: { p_username: string }; Returns: boolean }
    }
    Enums: {
      notification_type: "follow" | "review"
      series_watch_status:
        | "want_to_watch"
        | "watching"
        | "watched"
        | "abandoned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      notification_type: ["follow", "review"],
      series_watch_status: [
        "want_to_watch",
        "watching",
        "watched",
        "abandoned",
      ],
    },
  },
} as const
