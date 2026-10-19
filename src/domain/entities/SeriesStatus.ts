export const SERIES_STATUSES = ["watching", "want_to_watch", "watched", "abandoned"] as const;

export type SeriesStatus = (typeof SERIES_STATUSES)[number];

export const SERIES_STATUS_LABELS: Record<SeriesStatus, string> = {
  want_to_watch: "Want to Watch",
  watching: "Watching",
  watched: "Watched",
  abandoned: "Abandoned",
};

const CONTINUING_TMDB_STATUSES = [
  "returning series",
  "in production",
  "post production",
  "planned",
  "pilot",
  "rumored",
];

export function isContinuingSeries(tmdbStatus?: string | null): boolean {
  if (!tmdbStatus) {
    return false;
  }
  return CONTINUING_TMDB_STATUSES.includes(tmdbStatus.trim().toLowerCase());
}

export function formatSeriesStatusLabel(
  status: SeriesStatus,
  tmdbStatus?: string | null,
  upToDateLabel = "Up to Date"
): string {
  if (status === "watched" && isContinuingSeries(tmdbStatus)) {
    return upToDateLabel;
  }
  return SERIES_STATUS_LABELS[status];
}

export type UserSeriesStatus = {
  id: string;
  userId: string;
  seriesId: string;
  status: SeriesStatus;
  isFavorite: boolean;
  rewatchCount: number;
  rating: number | null;
  startedAt: string | null;
  completedAt: string | null;
};
