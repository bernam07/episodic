import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/core/config/env";
import { container } from "@/presentation/di/container";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification !== "undefined" &&
    !!env.vapidPublicKey
  );
}

export function usePushEnabled() {
  return useQuery({
    queryKey: ["push-enabled"],
    queryFn: () => container.repositories.push.isEnabled(),
    enabled: pushSupported(),
  });
}

export function useTogglePush() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enable: boolean): Promise<boolean> =>
      enable
        ? container.repositories.push.enable()
        : container.repositories.push.disable().then(() => false),
    onSuccess: (enabled) => queryClient.setQueryData(["push-enabled"], enabled),
  });
}
