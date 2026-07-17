export const SERIES_STATUSES = ["want_to_watch", "watching", "watched", "abandoned"] as const;

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
