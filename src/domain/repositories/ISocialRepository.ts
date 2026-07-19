import type {
  ProfileSearchResult,
  ProfileSummary,
  UserLibraryItem,
} from "../entities/Social";

export interface ISocialRepository {
  searchProfiles(query: string, limit?: number): Promise<ProfileSearchResult[]>;
  getProfileSummary(username: string): Promise<ProfileSummary | null>;
  getUserLibrary(userId: string, limit?: number): Promise<UserLibraryItem[]>;
  getUserFavorites(userId: string, limit?: number): Promise<UserLibraryItem[]>;
  getFollowers(username: string, limit?: number): Promise<ProfileSearchResult[]>;
  getFollowing(username: string, limit?: number): Promise<ProfileSearchResult[]>;
  follow(userId: string): Promise<void>;
  unfollow(userId: string): Promise<void>;
  isUsernameAvailable(username: string): Promise<boolean>;
}
