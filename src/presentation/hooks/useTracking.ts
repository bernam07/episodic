import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { airedEpisodeCount } from "@/domain/entities/Airing";
import { hasAired, type Episode } from "@/domain/entities/Episode";
import type { SeriesProgress } from "@/domain/entities/Progress";
import type { SeriesDetail } from "@/domain/entities/Series";
import {
  isContinuingSeries,
  type SeriesStatus,
  type UserSeriesStatus,
} from "@/domain/entities/SeriesStatus";
import { container } from "@/presentation/di/container";
import { queryKeys } from "./queryKeys";

export function useLibrary(status?: SeriesStatus) {
  return useQuery({
    queryKey: queryKeys.library(status),
    queryFn: () => container.usecases.getLibrary.execute(status),
    staleTime: 1000 * 30,
  });
}

export function useMyRatings(): Map<number, number> {
  const { data } = useLibrary();

  return useMemo(() => {
    const map = new Map<number, number>();
    for (const item of data ?? []) {
      if (item.userRating !== null) {
        map.set(item.tmdbId, item.userRating);
      }
    }
    return map;
  }, [data]);
}

export function useMyLibraryStatus(): Map<number, SeriesStatus> {
  const { data } = useLibrary();

  return useMemo(() => {
    const map = new Map<number, SeriesStatus>();
    for (const item of data ?? []) {
      map.set(item.tmdbId, item.status);
    }
    return map;
  }, [data]);
}

export function useMyWatched(): Set<number> {
  const { data } = useLibrary();

  return useMemo(() => {
    const set = new Set<number>();
    for (const item of data ?? []) {
      if (item.status === "watched") {
        set.add(item.tmdbId);
      }
    }
    return set;
  }, [data]);
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
      const [season, watchedIds] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: queryKeys.season(item.tmdbId, item.nextSeason),
          queryFn: () => container.usecases.getSeason.execute(item.tmdbId, item.nextSeason),
          staleTime: 1000 * 60 * 60 * 12,
        }),
        container.usecases.getWatchedEpisodes.execute(item.seriesId),
      ]);

      const ordered = [...season.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
      const episode =
        ordered.find((candidate) => hasAired(candidate) && !watchedIds.has(candidate.tmdbEpisodeId)) ??
        ordered[item.nextEpisode - 1];

      if (!episode) {
        return;
      }

      await container.repositories.tracking.markEpisode(item.seriesId, {
        tmdbEpisodeId: episode.tmdbEpisodeId,
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
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
    queryClient.invalidateQueries({ queryKey: queryKeys.watchStreak });
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

export function useSetFavoritePinned() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seriesId, pinned }: { seriesId: string; pinned: boolean }) =>
      container.repositories.tracking.setFavoritePinned(seriesId, pinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    },
  });
}

export function useReorderFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (seriesIds: string[]) =>
      container.repositories.tracking.reorderFavorites(seriesIds),
    onMutate: async (seriesIds) => {
      const key = queryKeys.library();
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SeriesProgress[]>(key);

      if (previous) {
        const base = Date.now();
        const order = new Map(seriesIds.map((id, index) => [id, index]));
        const next = previous.map((item) =>
          order.has(item.seriesId)
            ? {
                ...item,
                favoritePinnedAt: new Date(base + (order.get(item.seriesId) as number) * 1000).toISOString(),
              }
            : item
        );
        queryClient.setQueryData(key, next);
      }

      return { previous, key };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    },
  });
}

export function useWatchStreak() {
  return useQuery({
    queryKey: queryKeys.watchStreak,
    queryFn: () => container.repositories.tracking.getWatchStreak(),
    staleTime: 1000 * 60 * 5,
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

const syncedSeriesKeys = new Set<string>();
const syncedContinuingTmdbIds = new Set<number>();

export function useSyncSeriesDetailProgress(
  seriesId: string | null,
  detail: SeriesDetail | undefined,
  tracking: UserSeriesStatus | null | undefined,
  watchedEpisodes: number | null
) {
  const invalidate = useTrackingInvalidator();

  useEffect(() => {
    if (!seriesId || !detail || !tracking || watchedEpisodes === null) {
      return;
    }

    const aired = airedEpisodeCount(detail);
    const syncKey = `${seriesId}:${aired}:${detail.tmdbStatus ?? ""}:${tracking.status}:${watchedEpisodes}`;
    if (syncedSeriesKeys.has(syncKey)) {
      return;
    }
    syncedSeriesKeys.add(syncKey);

    let cancelled = false;

    void (async () => {
      try {
        await container.repositories.series.cacheSeries(detail, aired);
        if (tracking.status === "watched" && aired > watchedEpisodes) {
          await container.repositories.tracking.setStatus(seriesId, "watching");
        }
        if (!cancelled) {
          invalidate(seriesId);
        }
      } catch {
        return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [seriesId, detail, tracking, watchedEpisodes, invalidate]);
}

export function useSyncContinuingSeries() {
  const { data: library } = useLibrary();
  const queryClient = useQueryClient();
  const runningRef = useRef(false);

  useEffect(() => {
    if (!library || library.length === 0 || runningRef.current) {
      return;
    }

    const candidates = library.filter(
      (item) =>
        (item.status === "watched" || item.status === "watching") &&
        !syncedContinuingTmdbIds.has(item.tmdbId) &&
        (isContinuingSeries(item.tmdbStatus) ||
          !item.tmdbStatus ||
          (item.status === "watched" && item.airedEpisodes > item.watchedEpisodes))
    );

    if (candidates.length === 0) {
      return;
    }

    runningRef.current = true;

    void (async () => {
      let changed = false;

      for (const item of candidates.slice(0, 12)) {
        syncedContinuingTmdbIds.add(item.tmdbId);
        try {
          const detail = await container.usecases.getSeriesDetail.execute(item.tmdbId);
          const freshAired = airedEpisodeCount(detail);
          const needsCacheUpdate =
            freshAired > item.airedEpisodes ||
            detail.numberOfEpisodes !== item.numberOfEpisodes ||
            detail.tmdbStatus !== item.tmdbStatus;

          if (needsCacheUpdate) {
            await container.repositories.series.cacheSeries(detail, freshAired);
            changed = true;
          }

          const targetAired = Math.max(freshAired, item.airedEpisodes);
          if (item.status === "watched" && targetAired > item.watchedEpisodes) {
            await container.repositories.tracking.setStatus(item.seriesId, "watching");
            changed = true;
          }
        } catch {
          continue;
        }
      }

      runningRef.current = false;

      if (changed) {
        queryClient.invalidateQueries({ queryKey: ["library"] });
        queryClient.invalidateQueries({ queryKey: queryKeys.upNext });
        queryClient.invalidateQueries({ queryKey: queryKeys.continueWatching });
      }
    })();
  }, [library, queryClient]);
}
