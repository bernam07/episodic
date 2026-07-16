import type { SeriesDetail } from "./Series";
import type { SeriesStatus } from "./SeriesStatus";

export type EpisodeStub = {
  tmdbEpisodeId: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  airDate: string | null;
};

export type AiringStatus = "ended" | "returning" | "in_production" | "planned" | "unknown";

const ENDED_STATUSES = ["ended", "canceled", "cancelled"];
const RETURNING_STATUSES = ["returning series"];
const PRODUCTION_STATUSES = ["in production", "post production"];
const PLANNED_STATUSES = ["planned", "pilot", "rumored"];

export function airingStatus(detail: Pick<SeriesDetail, "tmdbStatus">): AiringStatus {
  const raw = detail.tmdbStatus?.trim().toLowerCase() ?? "";

  if (ENDED_STATUSES.includes(raw)) {
    return "ended";
  }
  if (RETURNING_STATUSES.includes(raw)) {
    return "returning";
  }
  if (PRODUCTION_STATUSES.includes(raw)) {
    return "in_production";
  }
  if (PLANNED_STATUSES.includes(raw)) {
    return "planned";
  }

  return "unknown";
}

export function isFinished(detail: Pick<SeriesDetail, "tmdbStatus">): boolean {
  return airingStatus(detail) === "ended";
}

export function airedEpisodeCount(
  detail: Pick<SeriesDetail, "seasonsMeta" | "numberOfEpisodes" | "lastEpisodeToAir" | "tmdbStatus">
): number {
  const last = detail.lastEpisodeToAir;

  if (!last) {
    return isFinished(detail) ? detail.numberOfEpisodes : 0;
  }

  const priorSeasons = detail.seasonsMeta
    .filter((season) => season.seasonNumber < last.seasonNumber)
    .reduce((sum, season) => sum + season.episodeCount, 0);

  return Math.min(priorSeasons + last.episodeNumber, detail.numberOfEpisodes);
}

export type WatchState =
  | { kind: "untracked"; airedEpisodes: number; totalEpisodes: number }
  | { kind: "not_started"; airedEpisodes: number; totalEpisodes: number }
  | { kind: "behind"; behind: number; watchedEpisodes: number; airedEpisodes: number }
  | { kind: "up_to_date"; nextEpisode: EpisodeStub | null; unairedEpisodes: number }
  | { kind: "completed" }
  | { kind: "abandoned"; watchedEpisodes: number; totalEpisodes: number };

export function describeWatchState(
  detail: SeriesDetail,
  watchedEpisodes: number,
  status: SeriesStatus | null
): WatchState {
  const aired = airedEpisodeCount(detail);
  const total = detail.numberOfEpisodes;

  if (status === "abandoned") {
    return { kind: "abandoned", watchedEpisodes, totalEpisodes: total };
  }

  if (!status) {
    return { kind: "untracked", airedEpisodes: aired, totalEpisodes: total };
  }

  if (total > 0 && watchedEpisodes >= total && isFinished(detail)) {
    return { kind: "completed" };
  }

  if (watchedEpisodes === 0) {
    return { kind: "not_started", airedEpisodes: aired, totalEpisodes: total };
  }

  if (aired > 0 && watchedEpisodes >= aired) {
    return {
      kind: "up_to_date",
      nextEpisode: detail.nextEpisodeToAir,
      unairedEpisodes: Math.max(total - aired, 0),
    };
  }

  return {
    kind: "behind",
    behind: Math.max(aired - watchedEpisodes, 0),
    watchedEpisodes,
    airedEpisodes: aired,
  };
}
