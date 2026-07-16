import type {
  FeedItem,
  ProfileSearchResult,
  ProfileSummary,
  UserLibraryItem,
} from "../entities/Social";

export interface ISocialRepository {
  searchProfiles(query: string, limit?: number): Promise<ProfileSearchResult[]>;
  getProfileSummary(username: string): Promise<ProfileSummary | null>;
  getFollowingFeed(limit?: number): Promise<FeedItem[]>;
  getUserLibrary(userId: string, limit?: number): Promise<UserLibraryItem[]>;
  follow(userId: string): Promise<void>;
  unfollow(userId: string): Promise<void>;
  isUsernameAvailable(username: string): Promise<boolean>;
}
