import { describe, expect, it } from "vitest";
import type { SeriesDetail } from "@/domain/entities/Series";
import type { ISeriesRepository } from "@/domain/repositories/ISeriesRepository";
import type { ITmdbRepository } from "@/domain/repositories/ITmdbRepository";
import type { ITrackingRepository } from "@/domain/repositories/ITrackingRepository";
import {
  CollectAiredEpisodes,
  EnsureSeriesCached,
  SetSeriesStatus,
} from "@/domain/usecases/tracking/TrackingUseCases";

const SERIES_ID = "series-1";

function detail(): SeriesDetail {
  return {
    tmdbId: 1396,
    name: "Breaking Bad",
    overview: null,
    posterPath: null,
    backdropPath: null,
    firstAirDate: "2008-01-20",
    voteAverage: null,
    lastAirDate: null,
    numberOfSeasons: 0,
    numberOfEpisodes: 0,
    genres: [],
    tmdbStatus: "Ended",
    inProduction: false,
    lastEpisodeToAir: null,
    nextEpisodeToAir: null,
    seasonsMeta: [],
  };
}

type Calls = {
  cleared: string[];
  watched: string[];
  status: Array<{ seriesId: string; status: string }>;
};

function makeUseCase() {
  const calls: Calls = { cleared: [], watched: [], status: [] };

  const tracking = {
    clearSeriesEpisodes: async (seriesId: string) => {
      calls.cleared.push(seriesId);
      return 0;
    },
    setSeriesWatched: async (seriesId: string) => {
      calls.watched.push(seriesId);
      return 0;
    },
    setStatus: async (seriesId: string, status: string) => {
      calls.status.push({ seriesId, status });
    },
  } as unknown as ITrackingRepository;

  const series = {
    cacheSeries: async () => SERIES_ID,
  } as unknown as ISeriesRepository;

  const tmdb = {
    getSeriesDetail: async () => detail(),
    getSeason: async () => ({ seasonNumber: 1, name: "", overview: null, posterPath: null, airDate: null, episodes: [] }),
  } as unknown as ITmdbRepository;

  const ensureCached = new EnsureSeriesCached(tmdb, series);
  const collectAired = new CollectAiredEpisodes(tmdb);
  const useCase = new SetSeriesStatus(tracking, ensureCached, collectAired);

  return { useCase, calls };
}

describe("SetSeriesStatus orchestration", () => {
  it("backfills episodes when set to watched", async () => {
    const { useCase, calls } = makeUseCase();
    await useCase.execute(1396, "watched", detail());
    expect(calls.watched).toEqual([SERIES_ID]);
    expect(calls.cleared).toEqual([]);
    expect(calls.status.at(-1)).toEqual({ seriesId: SERIES_ID, status: "watched" });
  });

  it("resets episodes when set to want_to_watch", async () => {
    const { useCase, calls } = makeUseCase();
    await useCase.execute(1396, "want_to_watch", detail());
    expect(calls.cleared).toEqual([SERIES_ID]);
    expect(calls.watched).toEqual([]);
    expect(calls.status.at(-1)).toEqual({ seriesId: SERIES_ID, status: "want_to_watch" });
  });

  it("touches neither when set to watching", async () => {
    const { useCase, calls } = makeUseCase();
    await useCase.execute(1396, "watching", detail());
    expect(calls.cleared).toEqual([]);
    expect(calls.watched).toEqual([]);
    expect(calls.status.at(-1)).toEqual({ seriesId: SERIES_ID, status: "watching" });
  });

  it("writes episodes before the status so an explicit choice wins over the trigger", async () => {
    const { useCase } = makeUseCase();
    const order: string[] = [];
    const tracking = {
      clearSeriesEpisodes: async () => {
        order.push("clear");
        return 0;
      },
      setSeriesWatched: async () => {
        order.push("watched");
        return 0;
      },
      setStatus: async () => {
        order.push("status");
      },
    } as unknown as ITrackingRepository;

    const series = { cacheSeries: async () => SERIES_ID } as unknown as ISeriesRepository;
    const tmdb = {
      getSeason: async () => ({ seasonNumber: 1, name: "", overview: null, posterPath: null, airDate: null, episodes: [] }),
    } as unknown as ITmdbRepository;

    const uc = new SetSeriesStatus(
      tracking,
      new EnsureSeriesCached(tmdb, series),
      new CollectAiredEpisodes(tmdb)
    );

    await uc.execute(1396, "watched", detail());
    expect(order).toEqual(["watched", "status"]);
  });
});
