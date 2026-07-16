import type { AuthUser, Profile } from "../entities/Profile";

export type Credentials = {
  email: string;
  password: string;
};

export type SignUpInput = Credentials & {
  username?: string;
};

export interface IAuthRepository {
  getCurrentUser(): Promise<AuthUser | null>;
  getProfile(userId: string): Promise<Profile | null>;
  signIn(input: Credentials): Promise<AuthUser>;
  signUp(input: SignUpInput): Promise<AuthUser | null>;
  signOut(): Promise<void>;
  onAuthChange(callback: (user: AuthUser | null) => void): () => void;
}
