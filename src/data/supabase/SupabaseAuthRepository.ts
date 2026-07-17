import { AppError } from "@/core/errors/AppError";
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
      .select("id, username, display_name, avatar_url, bio")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update({ display_name: input.displayName, bio: input.bio })
      .eq("id", userId)
      .select("id, username, display_name, avatar_url, bio")
      .single();

    if (error) {
      throw new AppError("unknown", error.message, error);
    }

    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
    };
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

  async signIn({ identifier, password }: SignInInput): Promise<AuthUser> {
    const { data, error } = await supabase.functions.invoke<{
      access_token: string;
      refresh_token: string;
    }>("auth-login", {
      method: "POST",
      body: { identifier, password },
    });

    if (error || !data?.access_token) {
      throw new AppError("auth", "Incorrect username or password.", error);
    }

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
