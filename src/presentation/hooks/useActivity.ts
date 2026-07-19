import { useQuery } from "@tanstack/react-query";
import { container } from "@/presentation/di/container";
import { queryKeys } from "./queryKeys";

export function useFriendsFeed() {
  return useQuery({
    queryKey: queryKeys.friendsFeed,
    queryFn: () => container.usecases.getActivityFeed.execute(50),
    staleTime: 1000 * 30,
  });
}

export function useUserDiary(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.userDiary(userId),
    queryFn: () => container.usecases.getUserDiary.execute(userId as string, 40),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}
