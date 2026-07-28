export type RatingBucket = { rating: number; count: number };

export type RatingSummary = {
  total: number;
  average: number | null;
  buckets: RatingBucket[];
};

const STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function summarizeRatings(rows: RatingBucket[]): RatingSummary {
  const counts = new Map(rows.map((row) => [row.rating, row.count]));
  const buckets = STEPS.map((rating) => ({ rating, count: counts.get(rating) ?? 0 }));
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const average =
    total === 0 ? null : buckets.reduce((sum, bucket) => sum + bucket.rating * bucket.count, 0) / total;

  return { total, average, buckets };
}
