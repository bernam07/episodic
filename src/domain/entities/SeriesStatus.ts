export const SERIES_STATUSES = ["watching", "want_to_watch", "watched", "abandoned"] as const;

export type SeriesStatus = (typeof SERIES_STATUSES)[number];

export const DISPLAY_SERIES_STATUSES = [
  "watching",
  "up_to_date",
  "want_to_watch",
  "watched",
  "abandoned",
] as const;

export type DisplaySeriesStatus = (typeof DISPLAY_SERIES_STATUSES)[number];

export const SERIES_STATUS_LABELS: Record<SeriesStatus, string> = {
  want_to_watch: "Want to Watch",
  watching: "Watching",
  watched: "Watched",
  abandoned: "Abandoned",
};

export const DISPLAY_SERIES_STATUS_LABELS: Record<DisplaySeriesStatus, string> = {
  watching: "Watching",
  up_to_date: "Up to Date",
  want_to_watch: "Want to Watch",
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

export type ContinuingCheckInput = {
  tmdbStatus?: string | null;
  hasUnairedSeason?: boolean;
  airedEpisodes?: number;
  numberOfEpisodes?: number;
  inProduction?: boolean;
  hasNextEpisode?: boolean;
};

export function isSeriesContinuing(input: ContinuingCheckInput): boolean {
  if (isContinuingSeries(input.tmdbStatus)) {
    return true;
  }
  if (input.hasUnairedSeason || input.inProduction || input.hasNextEpisode) {
    return true;
  }
  if (
    input.airedEpisodes !== undefined &&
    input.numberOfEpisodes !== undefined &&
    input.airedEpisodes > 0 &&
    input.numberOfEpisodes > input.airedEpisodes
  ) {
    return true;
  }
  return false;
}

export type DisplayStatusInput = ContinuingCheckInput & {
  status: SeriesStatus;
  watchedEpisodes?: number;
};

export function resolveDisplayStatus(input: DisplayStatusInput): DisplaySeriesStatus {
  if (input.status === "abandoned" || input.status === "want_to_watch") {
    return input.status;
  }

  const aired = input.airedEpisodes ?? 0;
  const watched = input.watchedEpisodes ?? 0;
  const continuing = isSeriesContinuing(input);

  if (aired > 0) {
    if (watched >= aired) {
      return continuing ? "up_to_date" : "watched";
    }
    if (input.status === "watched" && watched < aired) {
      return "watching";
    }
  }

  if (input.status === "watched") {
    return continuing ? "up_to_date" : "watched";
  }

  return "watching";
}

export function effectiveEpisodeTotal(input: {
  airedEpisodes?: number;
  numberOfEpisodes: number;
  tmdbStatus?: string | null;
  hasUnairedSeason?: boolean;
}): number {
  const aired = input.airedEpisodes ?? 0;
  if (aired > 0 && isSeriesContinuing(input)) {
    return aired;
  }
  return input.numberOfEpisodes > 0 ? input.numberOfEpisodes : aired;
}

export function formatSeriesStatusLabel(
  status: SeriesStatus | DisplaySeriesStatus,
  tmdbStatus?: string | null,
  upToDateLabel = "Up to Date",
  extra?: Omit<ContinuingCheckInput, "tmdbStatus"> & { watchedEpisodes?: number }
): string {
  if (status === "up_to_date") {
    return upToDateLabel;
  }
  const resolved = resolveDisplayStatus({
    status,
    tmdbStatus,
    ...extra,
  });
  if (resolved === "up_to_date") {
    return upToDateLabel;
  }
  return DISPLAY_SERIES_STATUS_LABELS[resolved];
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
