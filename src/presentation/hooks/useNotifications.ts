import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { container } from "@/presentation/di/container";
import { queryKeys } from "./queryKeys";

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => container.usecases.getNotifications.execute(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: () => container.usecases.getUnreadCount.execute(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => container.usecases.markNotificationsRead.execute(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.unreadCount, 0);
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}
