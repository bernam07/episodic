import { AppError } from "@/core/errors/AppError";
import type { AuthUser, Profile } from "@/domain/entities/Profile";
import type {
  Credentials,
  IAuthRepository,
  SignUpInput,
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
      .select("id, username, display_name, avatar_url")
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
    };
  }

  async signIn({ email, password }: Credentials): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new AppError("auth", "Incorrect email or password.", error);
    }

    return toAuthUser(data.user);
  }

  async signUp({ email, password, username }: SignUpInput): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: username ? { username, display_name: username } : {},
      },
    });

    if (error) {
      throw new AppError("auth", error.message, error);
    }

    return data.user ? toAuthUser(data.user) : null;
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
}
