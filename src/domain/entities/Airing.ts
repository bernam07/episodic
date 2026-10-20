import type { SeasonMeta, SeriesDetail } from "./Series";
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

export function hasContinuation(tmdbStatus: string | null | undefined): boolean {
  const status = airingStatus({ tmdbStatus: tmdbStatus ?? null });
  return status === "returning" || status === "in_production" || status === "planned";
}

export function hasUpcomingSeason(
  seasonsMeta: Pick<SeasonMeta, "seasonNumber" | "airDate" | "episodeCount">[],
  tmdbStatus?: string | null
): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const regular = seasonsMeta.filter((season) => season.seasonNumber > 0);
  const finished = isFinished({ tmdbStatus: tmdbStatus ?? null });

  if (regular.some((season) => Boolean(season.airDate) && (season.airDate as string) > today)) {
    return true;
  }

  if (finished) {
    return false;
  }

  if (regular.some((season) => season.episodeCount === 0)) {
    return true;
  }

  const hasDatedPastSeason = regular.some(
    (season) => Boolean(season.airDate) && (season.airDate as string) <= today
  );

  if (hasDatedPastSeason && regular.some((season) => !season.airDate)) {
    return true;
  }

  return false;
}

export function airedEpisodeCount(
  detail: Pick<SeriesDetail, "seasonsMeta" | "numberOfEpisodes" | "lastEpisodeToAir" | "tmdbStatus">
): number {
  const today = new Date().toISOString().slice(0, 10);
  const last = detail.lastEpisodeToAir;

  if (last) {
    const priorSeasons = detail.seasonsMeta
      .filter(
        (season) =>
          season.seasonNumber > 0 &&
          season.seasonNumber < last.seasonNumber &&
          (!season.airDate || season.airDate <= today)
      )
      .reduce((sum, season) => sum + season.episodeCount, 0);

    const computed = priorSeasons + last.episodeNumber;
    return detail.numberOfEpisodes > 0 ? Math.min(computed, detail.numberOfEpisodes) : computed;
  }

  const premieredEpisodes = detail.seasonsMeta
    .filter(
      (season) =>
        season.seasonNumber > 0 &&
        season.airDate !== null &&
        season.airDate <= today &&
        season.episodeCount > 0
    )
    .reduce((sum, season) => sum + season.episodeCount, 0);

  if (premieredEpisodes > 0) {
    return detail.numberOfEpisodes > 0
      ? Math.min(premieredEpisodes, detail.numberOfEpisodes)
      : premieredEpisodes;
  }

  return isFinished(detail) ? detail.numberOfEpisodes : 0;
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
  const continuing =
    !isFinished(detail) ||
    detail.inProduction ||
    Boolean(detail.nextEpisodeToAir) ||
    hasUpcomingSeason(detail.seasonsMeta, detail.tmdbStatus);

  if (status === "abandoned") {
    return { kind: "abandoned", watchedEpisodes, totalEpisodes: total };
  }

  if (!status) {
    return { kind: "untracked", airedEpisodes: aired, totalEpisodes: total };
  }

  if (total > 0 && watchedEpisodes >= total && !continuing) {
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
