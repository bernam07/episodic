import { describe, expect, it } from "vitest";
import { computeLibraryInsights } from "@/domain/entities/LibraryInsights";
import type { SeriesStatus } from "@/domain/entities/SeriesStatus";

type Item = {
  status: SeriesStatus;
  watchedEpisodes: number;
  episodeRuntime: number;
  isFavorite: boolean;
  rewatchCount: number;
  genres: string[];
  userRating: number | null;
};

function item(overrides: Partial<Item>): Item {
  return {
    status: "watching",
    watchedEpisodes: 0,
    episodeRuntime: 0,
    isFavorite: false,
    rewatchCount: 0,
    genres: [],
    userRating: null,
    ...overrides,
  };
}

describe("computeLibraryInsights", () => {
  it("sums episodes, watch time, favorites and rewatches", () => {
    const insights = computeLibraryInsights([
      item({ watchedEpisodes: 10, episodeRuntime: 30, isFavorite: true, rewatchCount: 2 }),
      item({ watchedEpisodes: 5, episodeRuntime: 60 }),
      item({ watchedEpisodes: 3, episodeRuntime: 0 }),
    ]);

    expect(insights.seriesTracked).toBe(3);
    expect(insights.episodesWatched).toBe(18);
    expect(insights.watchTimeMinutes).toBe(10 * 30 + 5 * 60);
    expect(insights.favorites).toBe(1);
    expect(insights.rewatches).toBe(2);
  });

  it("counts statuses and ranks genres with a cap of eight", () => {
    const items = [
      item({ status: "watched", genres: ["Drama", "Crime"] }),
      item({ status: "watched", genres: ["Drama"] }),
      item({ status: "abandoned", genres: ["Comedy"] }),
    ];
    const insights = computeLibraryInsights(items);

    expect(insights.statusCounts.watched).toBe(2);
    expect(insights.statusCounts.abandoned).toBe(1);
    expect(insights.finished).toBe(2);
    expect(insights.topGenres[0]).toEqual({ genre: "Drama", count: 2 });
    expect(insights.topGenres).toHaveLength(3);

    const many = Array.from({ length: 12 }, (_, index) => item({ genres: [`G${index}`] }));
    expect(computeLibraryInsights(many).topGenres).toHaveLength(8);
  });

  it("builds a rating summary and finds the most-watched series", () => {
    const heavy = item({ watchedEpisodes: 100, userRating: 4.5 });
    const insights = computeLibraryInsights([
      heavy,
      item({ watchedEpisodes: 20, userRating: 4.5 }),
      item({ watchedEpisodes: 0, userRating: 3 }),
    ]);

    expect(insights.ratings.total).toBe(3);
    expect(insights.ratings.buckets.find((b) => b.rating === 4.5)?.count).toBe(2);
    expect(insights.mostWatched).toBe(heavy);
  });

  it("handles an empty library", () => {
    const insights = computeLibraryInsights([]);
    expect(insights.seriesTracked).toBe(0);
    expect(insights.ratings.total).toBe(0);
    expect(insights.mostWatched).toBeNull();
  });
});
