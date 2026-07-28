import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { container } from "@/presentation/di/container";
import { queryKeys } from "./queryKeys";

export function useSearchProfiles(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: queryKeys.searchProfiles(trimmed),
    queryFn: () => container.usecases.searchProfiles.execute(trimmed),
    enabled: trimmed.length >= 2,
    placeholderData: (previous) => previous,
  });
}

export function useProfileSummary(username: string | null) {
  return useQuery({
    queryKey: queryKeys.profileSummary(username),
    queryFn: () => container.usecases.getProfileSummary.execute(username as string),
    enabled: !!username,
  });
}

export function useUserLibrary(userId: string | null, limit = 500) {
  return useQuery({
    queryKey: queryKeys.userLibrary(userId),
    queryFn: () => container.usecases.getUserLibrary.execute(userId as string, limit),
    enabled: !!userId,
  });
}

export function useUserFavorites(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.userFavorites(userId),
    queryFn: () => container.usecases.getUserFavorites.execute(userId as string),
    enabled: !!userId,
  });
}

export function useFollowers(username: string | null) {
  return useQuery({
    queryKey: queryKeys.followers(username),
    queryFn: () => container.usecases.getFollowers.execute(username as string),
    enabled: !!username,
  });
}

export function useFollowing(username: string | null) {
  return useQuery({
    queryKey: queryKeys.following(username),
    queryFn: () => container.usecases.getFollowing.execute(username as string),
    enabled: !!username,
  });
}

export function useCompareLibraries(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.comparison(userId),
    queryFn: () => container.usecases.compareLibraries.execute(userId as string),
    enabled: !!userId,
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, follow }: { userId: string; follow: boolean }) =>
      container.usecases.toggleFollow.execute(userId, follow),
    onSuccess: (_result, { userId, follow }) => {
      if (follow) {
        void container.repositories.push.notifyFollow(userId).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: ["search-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profile-summary"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.friendsFeed });
      queryClient.invalidateQueries({ queryKey: ["user-library"] });
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      queryClient.invalidateQueries({ queryKey: ["diary"] });
      queryClient.invalidateQueries({ queryKey: ["comparison"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });
}
