import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { preferredRegion } from "@/domain/entities/WatchProviders";
import type { SearchResult } from "@/domain/repositories/ITmdbRepository";
import { container } from "@/presentation/di/container";
import { queryKeys } from "./queryKeys";

function nextPageParam(last: SearchResult) {
  return last.page < last.totalPages ? last.page + 1 : undefined;
}

export function useTrending() {
  return useQuery({
    queryKey: queryKeys.trending,
    queryFn: () => container.usecases.getTrending.execute(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useInfiniteDiscover(genreId: number | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.discover(genreId),
    queryFn: ({ pageParam }) => container.usecases.discoverByGenre.execute(genreId, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    staleTime: 1000 * 60 * 30,
  });
}

export function useInfiniteTrending() {
  return useInfiniteQuery({
    queryKey: queryKeys.trendingInfinite,
    queryFn: ({ pageParam }) => container.usecases.getTrending.execute(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    staleTime: 1000 * 60 * 30,
  });
}

export function useGenres() {
  return useQuery({
    queryKey: queryKeys.genres,
    queryFn: () => container.usecases.getGenres.execute(),
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useRecommendations(tmdbId: number | null) {
  return useQuery({
    queryKey: queryKeys.recommendations(tmdbId),
    queryFn: () => container.usecases.getRecommendations.execute(tmdbId as number),
    enabled: tmdbId !== null && tmdbId > 0,
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

export function useCredits(tmdbId: number) {
  return useQuery({
    queryKey: queryKeys.credits(tmdbId),
    queryFn: () => container.usecases.getCredits.execute(tmdbId),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useWatchProviders(tmdbId: number) {
  return useQuery({
    queryKey: queryKeys.watchProviders(tmdbId),
    queryFn: () =>
      container.usecases.getWatchProviders.execute(tmdbId, preferredRegion(navigator.language)),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function usePersonDetail(personId: number | null) {
  return useQuery({
    queryKey: queryKeys.personDetail(personId ?? -1),
    queryFn: () => container.usecases.getPersonDetail.execute(personId as number),
    enabled: personId !== null && personId > 0,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
