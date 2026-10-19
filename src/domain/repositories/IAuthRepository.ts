import type { AuthUser, Profile } from "../entities/Profile";

export type SignInInput = {
  identifier: string;
  password: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  username: string;
};

export type UpdateProfileInput = {
  displayName: string;
  bio: string | null;
  bannerUrl?: string | null;
};

export interface IAuthRepository {
  getCurrentUser(): Promise<AuthUser | null>;
  getProfile(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile>;
  completeOnboarding(userId: string): Promise<void>;
  uploadAvatar(userId: string, file: File): Promise<string>;
  uploadBanner(userId: string, file: File): Promise<string>;
  signIn(input: SignInInput): Promise<AuthUser>;
  signUp(input: SignUpInput): Promise<AuthUser | null>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  onAuthChange(callback: (user: AuthUser | null) => void): () => void;
  deleteAccount(): Promise<void>;
}
