import { describe, expect, it } from "vitest";
import {
  airedEpisodeCount,
  airingStatus,
  describeWatchState,
  isFinished,
} from "@/domain/entities/Airing";
import type { EpisodeStub } from "@/domain/entities/Airing";
import type { SeriesDetail } from "@/domain/entities/Series";

function stub(seasonNumber: number, episodeNumber: number): EpisodeStub {
  return { tmdbEpisodeId: 1, seasonNumber, episodeNumber, name: "x", airDate: "2024-01-01" };
}

function series(overrides: Partial<SeriesDetail> = {}): SeriesDetail {
  return {
    tmdbId: 1,
    name: "Test",
    overview: null,
    posterPath: null,
    backdropPath: null,
    firstAirDate: "2020-01-01",
    voteAverage: null,
    lastAirDate: null,
    numberOfSeasons: 2,
    numberOfEpisodes: 20,
    genres: [],
    tmdbStatus: "Ended",
    inProduction: false,
    lastEpisodeToAir: null,
    nextEpisodeToAir: null,
    seasonsMeta: [
      { seasonNumber: 1, episodeCount: 10, name: "S1", airDate: null, posterPath: null },
      { seasonNumber: 2, episodeCount: 10, name: "S2", airDate: null, posterPath: null },
    ],
    backdrops: [],
    ...overrides,
  };
}

describe("airingStatus", () => {
  it("maps Ended to ended", () => {
    expect(airingStatus(series({ tmdbStatus: "Ended" }))).toBe("ended");
  });

  it("treats Canceled as ended", () => {
    expect(airingStatus(series({ tmdbStatus: "Canceled" }))).toBe("ended");
  });

  it("maps Returning Series to returning", () => {
    expect(airingStatus(series({ tmdbStatus: "Returning Series" }))).toBe("returning");
  });

  it("maps In Production to in_production", () => {
    expect(airingStatus(series({ tmdbStatus: "In Production" }))).toBe("in_production");
  });

  it("maps Planned to planned", () => {
    expect(airingStatus(series({ tmdbStatus: "Planned" }))).toBe("planned");
  });

  it("falls back to unknown for null", () => {
    expect(airingStatus(series({ tmdbStatus: null }))).toBe("unknown");
  });

  it("is case-insensitive", () => {
    expect(airingStatus(series({ tmdbStatus: "ENDED" }))).toBe("ended");
  });
});

describe("isFinished", () => {
  it("is true only for ended series", () => {
    expect(isFinished(series({ tmdbStatus: "Ended" }))).toBe(true);
    expect(isFinished(series({ tmdbStatus: "Returning Series" }))).toBe(false);
  });
});

describe("airedEpisodeCount", () => {
  it("falls back to the total when an ended series has no lastEpisodeToAir", () => {
    expect(airedEpisodeCount(series({ tmdbStatus: "Ended", lastEpisodeToAir: null }))).toBe(20);
  });

  it("is zero for a returning series with no lastEpisodeToAir", () => {
    expect(airedEpisodeCount(series({ tmdbStatus: "Returning Series", lastEpisodeToAir: null }))).toBe(0);
  });

  it("sums prior seasons plus the last aired episode", () => {
    expect(
      airedEpisodeCount(series({ tmdbStatus: "Returning Series", lastEpisodeToAir: stub(2, 3) }))
    ).toBe(13);
  });

  it("counts within the first season correctly", () => {
    expect(
      airedEpisodeCount(series({ tmdbStatus: "Returning Series", lastEpisodeToAir: stub(1, 5) }))
    ).toBe(5);
  });

  it("never exceeds the total episode count", () => {
    expect(airedEpisodeCount(series({ numberOfEpisodes: 12, lastEpisodeToAir: stub(2, 10) }))).toBe(12);
  });
});

describe("describeWatchState", () => {
  it("is untracked with no status", () => {
    expect(describeWatchState(series(), 0, null).kind).toBe("untracked");
  });

  it("keeps abandoned above every other state", () => {
    expect(describeWatchState(series(), 20, "abandoned").kind).toBe("abandoned");
  });

  it("is completed when an ended series is fully watched", () => {
    expect(describeWatchState(series({ tmdbStatus: "Ended" }), 20, "watched").kind).toBe("completed");
  });

  it("is not_started when tracked but nothing watched", () => {
    expect(describeWatchState(series(), 0, "want_to_watch").kind).toBe("not_started");
  });

  it("is up_to_date when every aired episode of a returning series is watched", () => {
    const state = describeWatchState(
      series({ tmdbStatus: "Returning Series", lastEpisodeToAir: stub(2, 3) }),
      13,
      "watching"
    );
    expect(state.kind).toBe("up_to_date");
  });

  it("reports remaining unaired episodes when up to date", () => {
    const state = describeWatchState(
      series({ tmdbStatus: "Returning Series", lastEpisodeToAir: stub(2, 3) }),
      13,
      "watching"
    );
    expect(state).toMatchObject({ kind: "up_to_date", unairedEpisodes: 7 });
  });

  it("reports how many aired episodes are behind", () => {
    expect(
      describeWatchState(series({ tmdbStatus: "Returning Series", lastEpisodeToAir: stub(2, 3) }), 8, "watching")
    ).toEqual({ kind: "behind", behind: 5, watchedEpisodes: 8, airedEpisodes: 13 });
  });

  it("is up_to_date, not completed, when a returning series is fully watched", () => {
    expect(
      describeWatchState(series({ tmdbStatus: "Returning Series", lastEpisodeToAir: stub(2, 10) }), 20, "watching").kind
    ).toBe("up_to_date");
  });

  it("is behind when an ended series is missing one episode", () => {
    expect(
      describeWatchState(series({ tmdbStatus: "Ended", lastEpisodeToAir: stub(2, 10) }), 19, "watching").kind
    ).toBe("behind");
  });
});
