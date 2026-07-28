export type ListSummary = {
  id: string;
  title: string;
  description: string | null;
  isPrivate: boolean;
  itemCount: number;
  updatedAt: string;
  posterPaths: string[];
};

export type ListDetail = {
  id: string;
  title: string;
  description: string | null;
  isPrivate: boolean;
  itemCount: number;
  updatedAt: string;
  ownerId: string;
  ownerUsername: string;
  ownerDisplayName: string | null;
  ownerAvatarUrl: string | null;
  isOwn: boolean;
};

export type ListItem = {
  seriesId: string;
  tmdbId: number;
  seriesName: string;
  posterPath: string | null;
  addedAt: string;
};

export type ListInput = {
  title: string;
  description: string | null;
  isPrivate: boolean;
};

export const MAX_LIST_TITLE = 80;
export const MAX_LIST_DESCRIPTION = 500;

export function isValidListTitle(title: string): boolean {
  const trimmed = title.trim();
  return trimmed.length >= 1 && trimmed.length <= MAX_LIST_TITLE;
}
