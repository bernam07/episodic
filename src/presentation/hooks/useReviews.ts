import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SubmitReviewInput } from "@/domain/repositories/IReviewRepository";
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
    mutationFn: (input: Omit<SubmitReviewInput, "seriesId">) =>
      container.usecases.submitReview.execute({ ...input, seriesId: seriesId as string }),
    onSuccess: () => {
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
