export const SERIES_STATUSES = ["watching", "want_to_watch", "watched", "abandoned"] as const;

export type SeriesStatus = (typeof SERIES_STATUSES)[number];

export const SERIES_STATUS_LABELS: Record<SeriesStatus, string> = {
  want_to_watch: "Want to Watch",
  watching: "Watching",
  watched: "Watched",
  abandoned: "Abandoned",
};

export type UserSeriesStatus = {
  id: string;
  userId: string;
  seriesId: string;
  status: SeriesStatus;
  isFavorite: boolean;
  startedAt: string | null;
  completedAt: string | null;
};
