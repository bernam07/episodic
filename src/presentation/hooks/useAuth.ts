import { useContext } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppError } from "@/core/errors/AppError";
import { container } from "@/presentation/di/container";
import { AuthContext } from "@/presentation/providers/AuthProvider";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}

export function useUpdateProfile() {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { displayName: string; bio: string }) => {
      if (!user) {
        throw new AppError("auth", "You need to be signed in.");
      }

      return container.usecases.updateProfile.execute(user.id, input);
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["profile-summary"] });
      queryClient.invalidateQueries({ queryKey: ["search-profiles"] });
    },
  });
}

export function useUploadAvatar() {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      if (!user) {
        throw new AppError("auth", "You need to be signed in.");
      }

      return container.usecases.uploadAvatar.execute(user.id, file);
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["profile-summary"] });
      queryClient.invalidateQueries({ queryKey: ["search-profiles"] });
    },
  });
}
