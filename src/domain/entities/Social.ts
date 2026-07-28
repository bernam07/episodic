import type { SeriesStatus } from "./SeriesStatus";

export type ProfileSearchResult = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  seriesCount: number;
  isFollowing: boolean;
};

export type ProfileSummary = ProfileSearchResult & {
  bio: string | null;
  episodesWatched: number;
  reviewsCount: number;
  isSelf: boolean;
};

export type UserLibraryItem = {
  seriesId: string;
  tmdbId: number;
  seriesName: string;
  posterPath: string | null;
  status: SeriesStatus;
  isFavorite: boolean;
  rating: number | null;
  updatedAt: string;
};

export function initials(profile: Pick<ProfileSearchResult, "username" | "displayName">): string {
  const source = profile.displayName?.trim() || profile.username;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
