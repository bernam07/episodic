import { createClient } from "@supabase/supabase-js";
import { env } from "@/core/config/env";
import type { Database } from "@/types/database.types";

export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "episodic.auth",
  },
});

export type SupabaseClientType = typeof supabase;
