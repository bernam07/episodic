import { describe, expect, it } from "vitest";
import { computeLibraryStats } from "@/domain/entities/LibraryStats";
import type { SeriesProgress } from "@/domain/entities/Progress";

type Item = Pick<SeriesProgress, "status" | "watchedEpisodes" | "userRating" | "isFavorite">;

function item(overrides: Partial<Item> = {}): Item {
  return { status: "watching", watchedEpisodes: 0, userRating: null, isFavorite: false, ...overrides };
}

describe("computeLibraryStats", () => {
  it("is all zeros for an empty library", () => {
    expect(computeLibraryStats([])).toEqual({
      episodesWatched: 0,
      seriesTracked: 0,
      finished: 0,
      favorites: 0,
      averageRating: null,
    });
  });

  it("sums episodes and counts tracked series", () => {
    const stats = computeLibraryStats([
      item({ watchedEpisodes: 7 }),
      item({ watchedEpisodes: 5 }),
    ]);
    expect(stats.episodesWatched).toBe(12);
    expect(stats.seriesTracked).toBe(2);
  });

  it("counts only watched series as finished", () => {
    const stats = computeLibraryStats([
      item({ status: "watched" }),
      item({ status: "watched" }),
      item({ status: "watching" }),
      item({ status: "abandoned" }),
    ]);
    expect(stats.finished).toBe(2);
  });

  it("counts favorites", () => {
    const stats = computeLibraryStats([
      item({ isFavorite: true }),
      item({ isFavorite: false }),
      item({ isFavorite: true }),
    ]);
    expect(stats.favorites).toBe(2);
  });

  it("averages only rated series and rounds to one decimal", () => {
    const stats = computeLibraryStats([
      item({ userRating: 4 }),
      item({ userRating: 5 }),
      item({ userRating: null }),
    ]);
    expect(stats.averageRating).toBe(4.5);
  });

  it("has a null average when nothing is rated", () => {
    expect(computeLibraryStats([item(), item()]).averageRating).toBeNull();
  });
});
