import type { SeriesStatus } from "./SeriesStatus";

export type ComparisonItem = {
  tmdbId: number;
  seriesName: string;
  posterPath: string | null;
  genres: string[];
  myStatus: SeriesStatus | null;
  myRating: number | null;
  theirStatus: SeriesStatus | null;
  theirRating: number | null;
};

export type ComparisonStats = {
  both: number;
  onlyMe: number;
  onlyThem: number;
  compatibilityPercent: number;
};

export function computeComparisonStats(items: ComparisonItem[]): ComparisonStats {
  let both = 0;
  let onlyMe = 0;
  let onlyThem = 0;

  for (const item of items) {
    if (item.myStatus && item.theirStatus) both++;
    else if (item.myStatus) onlyMe++;
    else onlyThem++;
  }

  const total = both + onlyMe + onlyThem;
  const compatibilityPercent = total > 0 ? Math.round((both / total) * 100) : 0;

  return { both, onlyMe, onlyThem, compatibilityPercent };
}
