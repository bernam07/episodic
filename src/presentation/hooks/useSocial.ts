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

export function useFollowingFeed() {
  return useQuery({
    queryKey: queryKeys.followingFeed,
    queryFn: () => container.usecases.getFollowingFeed.execute(40),
    staleTime: 1000 * 30,
  });
}

export function useProfileSummary(username: string | null) {
  return useQuery({
    queryKey: queryKeys.profileSummary(username),
    queryFn: () => container.usecases.getProfileSummary.execute(username as string),
    enabled: !!username,
  });
}

export function useUserLibrary(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.userLibrary(userId),
    queryFn: () => container.usecases.getUserLibrary.execute(userId as string),
    enabled: !!userId,
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, follow }: { userId: string; follow: boolean }) =>
      container.usecases.toggleFollow.execute(userId, follow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profile-summary"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.followingFeed });
      queryClient.invalidateQueries({ queryKey: ["user-library"] });
    },
  });
}
