export type Review = {
  id: string;
  userId: string;
  seriesId: string;
  rating: number | null;
  body: string | null;
  containsSpoilers: boolean;
  createdAt: string;
  author?: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  series?: {
    tmdbId: number;
    name: string;
    posterPath: string | null;
  };
};

export const MIN_RATING = 0.5;
export const MAX_RATING = 5;
export const RATING_STEP = 0.5;

export function isValidRating(rating: number): boolean {
  if (rating < MIN_RATING || rating > MAX_RATING) {
    return false;
  }
  return Number.isInteger(rating / RATING_STEP);
}
