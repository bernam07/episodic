import { useQuery } from "@tanstack/react-query";
import { container } from "@/presentation/di/container";
import { queryKeys } from "./queryKeys";

export function useTrending() {
  return useQuery({
    queryKey: queryKeys.trending,
    queryFn: () => container.usecases.getTrending.execute(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useSearchSeries(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: queryKeys.search(trimmed),
    queryFn: () => container.usecases.searchSeries.execute(trimmed),
    enabled: trimmed.length >= 2,
    placeholderData: (previous) => previous,
  });
}

export function useSeriesDetail(tmdbId: number) {
  return useQuery({
    queryKey: queryKeys.seriesDetail(tmdbId),
    queryFn: () => container.usecases.getSeriesDetail.execute(tmdbId),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
    staleTime: 1000 * 60 * 60 * 12,
  });
}

export function useSeason(tmdbId: number, seasonNumber: number | null) {
  return useQuery({
    queryKey: queryKeys.season(tmdbId, seasonNumber ?? -1),
    queryFn: () => container.usecases.getSeason.execute(tmdbId, seasonNumber as number),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0 && seasonNumber !== null,
    staleTime: 1000 * 60 * 60 * 12,
  });
}
