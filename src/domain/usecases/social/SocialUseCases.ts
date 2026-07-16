import type {
  FeedItem,
  ProfileSearchResult,
  ProfileSummary,
  UserLibraryItem,
} from "@/domain/entities/Social";
import type { ISocialRepository } from "@/domain/repositories/ISocialRepository";

const MIN_QUERY_LENGTH = 2;

export class SearchProfiles {
  constructor(private readonly social: ISocialRepository) {}

  async execute(query: string, limit = 20): Promise<ProfileSearchResult[]> {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      return [];
    }

    return this.social.searchProfiles(trimmed, limit);
  }
}

export class GetProfileSummary {
  constructor(private readonly social: ISocialRepository) {}

  async execute(username: string): Promise<ProfileSummary | null> {
    return this.social.getProfileSummary(username);
  }
}

export class GetFollowingFeed {
  constructor(private readonly social: ISocialRepository) {}

  async execute(limit = 40): Promise<FeedItem[]> {
    return this.social.getFollowingFeed(limit);
  }
}

export class GetUserLibrary {
  constructor(private readonly social: ISocialRepository) {}

  async execute(userId: string, limit = 60): Promise<UserLibraryItem[]> {
    return this.social.getUserLibrary(userId, limit);
  }
}

export class ToggleFollow {
  constructor(private readonly social: ISocialRepository) {}

  async execute(userId: string, follow: boolean): Promise<void> {
    if (follow) {
      return this.social.follow(userId);
    }

    return this.social.unfollow(userId);
  }
}
