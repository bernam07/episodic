import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { container } from "@/presentation/di/container";
import { queryKeys } from "./queryKeys";

export function useSeriesReviews(seriesId: string | null) {
  return useQuery({
    queryKey: queryKeys.seriesReviews(seriesId),
    queryFn: () => container.usecases.getSeriesReviews.execute(seriesId as string),
    enabled: !!seriesId,
  });
}

export function useOwnReview(seriesId: string | null) {
  return useQuery({
    queryKey: queryKeys.ownReview(seriesId),
    queryFn: () => container.usecases.getOwnReview.execute(seriesId as string),
    enabled: !!seriesId,
  });
}

export function useOwnReviews() {
  return useQuery({
    queryKey: queryKeys.ownReviews,
    queryFn: () => container.usecases.getOwnReviews.execute(),
  });
}

export function useRatingSummary(seriesId: string | null) {
  return useQuery({
    queryKey: queryKeys.ratingSummary(seriesId),
    queryFn: () => container.usecases.getRatingSummary.execute(seriesId as string),
    enabled: !!seriesId,
  });
}

export function useSubmitReview(seriesId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { body: string; containsSpoilers: boolean }) =>
      container.usecases.submitReview.execute({ ...input, seriesId: seriesId as string }),
    onSuccess: () => {
      if (seriesId) {
        void container.repositories.push.notifyReview(seriesId).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.seriesReviews(seriesId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ownReview(seriesId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ownReviews });
      queryClient.invalidateQueries({ queryKey: queryKeys.friendsFeed });
      queryClient.invalidateQueries({ queryKey: ["diary"] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (seriesId: string) => container.usecases.deleteReview.execute(seriesId),
    onSuccess: (_result, seriesId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seriesReviews(seriesId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ownReview(seriesId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ownReviews });
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.friendsFeed });
      queryClient.invalidateQueries({ queryKey: ["diary"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ratingSummary(seriesId) });
    },
  });
}
