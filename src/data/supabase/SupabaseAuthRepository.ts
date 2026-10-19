import { AppError } from "@/core/errors/AppError";
import { env } from "@/core/config/env";
import type { AuthUser, Profile } from "@/domain/entities/Profile";
import type {
  IAuthRepository,
  SignInInput,
  SignUpInput,
  UpdateProfileInput,
} from "@/domain/repositories/IAuthRepository";
import { supabase } from "./client";

function toAuthUser(user: { id: string; email?: string }): AuthUser {
  return { id: user.id, email: user.email ?? null };
}

function getLocalBanner(userId: string): string | null {
  try {
    return localStorage.getItem(`episodic_banner_${userId}`);
  } catch {
    return null;
  }
}

function setLocalBanner(userId: string, url: string | null): void {
  try {
    if (url) {
      localStorage.setItem(`episodic_banner_${userId}`, url);
    } else {
      localStorage.removeItem(`episodic_banner_${userId}`);
    }
  } catch {
    return;
  }
}

export class SupabaseAuthRepository implements IAuthRepository {
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new AppError("auth", error.message, error);
    }

    return data.session ? toAuthUser(data.session.user) : null;
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    if (!data) {
      return null;
    }

    const row = data as Record<string, unknown>;
    const dbBanner = typeof row.banner_url === "string" ? row.banner_url : null;

    return {
      id: String(row.id),
      username: String(row.username),
      displayName: typeof row.display_name === "string" ? row.display_name : null,
      avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
      bannerUrl: dbBanner ?? getLocalBanner(userId),
      bio: typeof row.bio === "string" ? row.bio : null,
      onboarded: Boolean(row.onboarded),
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    if (input.bannerUrl !== undefined) {
      setLocalBanner(userId, input.bannerUrl);
    }

    const payload: {
      display_name: string | null;
      bio: string | null;
      banner_url?: string | null;
    } = {
      display_name: input.displayName,
      bio: input.bio,
    };

    if (input.bannerUrl !== undefined) {
      payload.banner_url = input.bannerUrl;
    }

    let { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select("*")
      .single();

    if (error && input.bannerUrl !== undefined) {
      const retry = await supabase
        .from("profiles")
        .update({ display_name: input.displayName, bio: input.bio })
        .eq("id", userId)
        .select("*")
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      throw new AppError("unknown", error?.message ?? "Could not update profile.", error);
    }

    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      bannerUrl: data.banner_url ?? getLocalBanner(userId),
      bio: data.bio,
      onboarded: data.onboarded,
    };
  }

  async completeOnboarding(userId: string): Promise<void> {
    const { error } = await supabase.from("profiles").update({ onboarded: true }).eq("id", userId);

    if (error) {
      throw new AppError("unknown", error.message, error);
    }
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const path = `${userId}/avatar`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

    if (uploadError) {
      throw new AppError("unknown", uploadError.message, uploadError);
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId);

    if (updateError) {
      throw new AppError("unknown", updateError.message, updateError);
    }

    return avatarUrl;
  }

  async uploadBanner(userId: string, file: File): Promise<string> {
    const path = `${userId}/banner`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

    if (uploadError) {
      throw new AppError("unknown", uploadError.message, uploadError);
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const bannerUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    setLocalBanner(userId, bannerUrl);

    await supabase
      .from("profiles")
      .update({ banner_url: bannerUrl })
      .eq("id", userId);

    return bannerUrl;
  }

  async signIn({ identifier, password }: SignInInput): Promise<AuthUser> {
    const response = await fetch(`${env.supabaseUrl}/functions/v1/auth-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.supabasePublishableKey,
      },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      throw new AppError("auth", "Incorrect username or password.");
    }

    const data: { access_token: string; refresh_token: string } = await response.json();

    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    if (sessionError || !session.user) {
      throw new AppError("auth", "Could not start your session.", sessionError);
    }

    return toAuthUser(session.user);
  }

  async signUp({ email, password, username }: SignUpInput): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
      },
    });

    if (error) {
      const taken =
        error.message.toLowerCase().includes("username_taken") ||
        error.message.toLowerCase().includes("duplicate");

      throw new AppError(
        "auth",
        taken ? `Username "${username}" is already taken.` : error.message,
        error
      );
    }

    return data.user ? toAuthUser(data.user) : null;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new AppError("auth", error.message, error);
    }
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw new AppError("auth", error.message, error);
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new AppError("auth", error.message, error);
    }
  }

  onAuthChange(callback: (user: AuthUser | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session ? toAuthUser(session.user) : null);
    });

    return () => data.subscription.unsubscribe();
  }

  async deleteAccount(): Promise<void> {
    const { error } = await supabase.rpc("delete_own_account");

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    await supabase.auth.signOut();
  }
}
