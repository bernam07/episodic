import type { SeriesStatus } from "@/domain/entities/SeriesStatus";

export const queryKeys = {
  trending: ["trending"] as const,
  search: (query: string) => ["search", query] as const,
  seriesDetail: (tmdbId: number) => ["series", tmdbId] as const,
  season: (tmdbId: number, seasonNumber: number) => ["series", tmdbId, "season", seasonNumber] as const,
  library: (status?: SeriesStatus) => ["library", status ?? "all"] as const,
  continueWatching: ["continue-watching"] as const,
  tracking: (seriesId: string | null) => ["tracking", seriesId] as const,
  seasonProgress: (seriesId: string | null) => ["season-progress", seriesId] as const,
  watchedEpisodes: (seriesId: string | null) => ["watched-episodes", seriesId] as const,
  seriesReviews: (seriesId: string | null) => ["reviews", seriesId] as const,
  ownReview: (seriesId: string | null) => ["own-review", seriesId] as const,
  ownReviews: ["own-reviews"] as const,
};
