import { describe, expect, it } from "vitest";
import { summarizeRatings } from "@/domain/entities/RatingSummary";

describe("summarizeRatings", () => {
  it("returns a full 10-bucket histogram", () => {
    const summary = summarizeRatings([{ rating: 4.5, count: 2 }]);
    expect(summary.buckets).toHaveLength(10);
    expect(summary.buckets.map((bucket) => bucket.rating)).toEqual([
      0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5,
    ]);
  });

  it("computes the weighted average and total", () => {
    const summary = summarizeRatings([
      { rating: 3, count: 1 },
      { rating: 4.5, count: 2 },
    ]);
    expect(summary.total).toBe(3);
    expect(summary.average).toBeCloseTo((3 + 4.5 * 2) / 3, 5);
  });

  it("reports a null average when there are no ratings", () => {
    const summary = summarizeRatings([]);
    expect(summary.total).toBe(0);
    expect(summary.average).toBeNull();
  });
});
