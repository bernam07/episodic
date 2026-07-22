import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Episode } from "@/domain/entities/Episode";
import type { SeriesDetail } from "@/domain/entities/Series";
import type { SeriesStatus } from "@/domain/entities/SeriesStatus";
import { container } from "@/presentation/di/container";
import { queryKeys } from "./queryKeys";

export function useLibrary(status?: SeriesStatus) {
  return useQuery({
    queryKey: queryKeys.library(status),
    queryFn: () => container.usecases.getLibrary.execute(status),
    staleTime: 1000 * 30,
  });
}

export function useContinueWatching() {
  return useQuery({
    queryKey: queryKeys.continueWatching,
    queryFn: () => container.usecases.getContinueWatching.execute(10),
    staleTime: 1000 * 30,
  });
}

export function useUpNext() {
  return useQuery({
    queryKey: queryKeys.upNext,
    queryFn: () => container.usecases.getUpNext.execute(20),
    staleTime: 1000 * 30,
  });
}

export function useMarkUpNext() {
  const queryClient = useQueryClient();
  const invalidate = useTrackingInvalidator();

  return useMutation({
    mutationFn: async (item: {
      seriesId: string;
      tmdbId: number;
      nextSeason: number;
      nextEpisode: number;
    }) => {
      const season = await queryClient.fetchQuery({
        queryKey: queryKeys.season(item.tmdbId, item.nextSeason),
        queryFn: () => container.usecases.getSeason.execute(item.tmdbId, item.nextSeason),
        staleTime: 1000 * 60 * 60 * 12,
      });

      const episode = season.episodes.find((candidate) => candidate.episodeNumber === item.nextEpisode);

      if (!episode) {
        return;
      }

      await container.repositories.tracking.markEpisode(item.seriesId, {
        tmdbEpisodeId: episode.tmdbEpisodeId,
        seasonNumber: item.nextSeason,
        episodeNumber: item.nextEpisode,
      });
    },
    onSuccess: (_result, item) => invalidate(item.seriesId),
  });
}

export function useLocalSeriesId(tmdbId: number) {
  return useQuery({
    queryKey: ["local-series-id", tmdbId],
    queryFn: () => container.repositories.series.findLocalIdByTmdbId(tmdbId),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
  });
}

export function useSeriesTracking(seriesId: string | null) {
  return useQuery({
    queryKey: queryKeys.tracking(seriesId),
    queryFn: () => container.repositories.tracking.getStatus(seriesId as string),
    enabled: !!seriesId,
  });
}

export function useSeasonProgress(seriesId: string | null) {
  return useQuery({
    queryKey: queryKeys.seasonProgress(seriesId),
    queryFn: () => container.usecases.getSeasonProgress.execute(seriesId as string),
    enabled: !!seriesId,
  });
}

export function useWatchedEpisodes(seriesId: string | null) {
  return useQuery({
    queryKey: queryKeys.watchedEpisodes(seriesId),
    queryFn: () => container.usecases.getWatchedEpisodes.execute(seriesId as string),
    enabled: !!seriesId,
  });
}

function useTrackingInvalidator() {
  const queryClient = useQueryClient();

  return (seriesId: string | null) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tracking(seriesId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.seasonProgress(seriesId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.watchedEpisodes(seriesId) });
    queryClient.invalidateQueries({ queryKey: ["library"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.continueWatching });
    queryClient.invalidateQueries({ queryKey: queryKeys.upNext });
    queryClient.invalidateQueries({ queryKey: queryKeys.friendsFeed });
    queryClient.invalidateQueries({ queryKey: ["diary"] });
  };
}

export function useSetSeriesStatus(tmdbId: number, detail?: SeriesDetail) {
  const queryClient = useQueryClient();
  const invalidate = useTrackingInvalidator();

  return useMutation({
    mutationFn: (status: SeriesStatus) =>
      container.usecases.setSeriesStatus.execute(tmdbId, status, detail),
    onSuccess: (seriesId) => {
      queryClient.setQueryData(["local-series-id", tmdbId], seriesId);
      invalidate(seriesId);
    },
  });
}

export function useRemoveFromLibrary(seriesId: string | null) {
  const invalidate = useTrackingInvalidator();

  return useMutation({
    mutationFn: () => container.usecases.removeFromLibrary.execute(seriesId as string),
    onSuccess: () => invalidate(seriesId),
  });
}

export function useToggleEpisode(seriesId: string | null) {
  const queryClient = useQueryClient();
  const invalidate = useTrackingInvalidator();

  return useMutation({
    mutationFn: ({ episode, watched }: { episode: Episode; watched: boolean }) =>
      container.usecases.toggleEpisodeWatched.execute(seriesId as string, episode, watched),
    onMutate: async ({ episode, watched }) => {
      const key = queryKeys.watchedEpisodes(seriesId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<Set<number>>(key);
      const next = new Set(previous ?? []);

      if (watched) {
        next.add(episode.tmdbEpisodeId);
      } else {
        next.delete(episode.tmdbEpisodeId);
      }

      queryClient.setQueryData(key, next);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.watchedEpisodes(seriesId), context.previous);
      }
    },
    onSettled: () => invalidate(seriesId),
  });
}

export function useToggleFavorite(seriesId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => container.usecases.toggleFavorite.execute(seriesId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tracking(seriesId) });
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useSetRating(seriesId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rating: number | null) =>
      container.usecases.setRating.execute(seriesId as string, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tracking(seriesId) });
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ratingSummary(seriesId) });
    },
  });
}

export function useBumpRewatch(seriesId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (delta: number) =>
      container.repositories.tracking.bumpRewatch(seriesId as string, delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tracking(seriesId) });
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useToggleSeason(seriesId: string | null) {
  const invalidate = useTrackingInvalidator();

  return useMutation({
    mutationFn: ({
      seasonNumber,
      episodes,
      watched,
    }: {
      seasonNumber: number;
      episodes: Episode[];
      watched: boolean;
    }) =>
      container.usecases.toggleSeasonWatched.execute(
        seriesId as string,
        seasonNumber,
        episodes,
        watched
      ),
    onSuccess: () => invalidate(seriesId),
  });
}
