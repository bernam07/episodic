import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListInput } from "@/domain/entities/List";
import type { SeriesDetail } from "@/domain/entities/Series";
import { container } from "@/presentation/di/container";
import { queryKeys } from "./queryKeys";

export function useUserLists(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.userLists(userId),
    queryFn: () => container.usecases.getUserLists.execute(userId as string),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

export function useList(listId: string | null) {
  return useQuery({
    queryKey: queryKeys.list(listId),
    queryFn: () => container.usecases.getList.execute(listId as string),
    enabled: !!listId,
  });
}

export function useListItems(listId: string | null) {
  return useQuery({
    queryKey: queryKeys.listItems(listId),
    queryFn: () => container.usecases.getListItems.execute(listId as string),
    enabled: !!listId,
  });
}

export function useListSaveInfo(listId: string | null) {
  return useQuery({
    queryKey: ["list-save", listId],
    queryFn: () => container.repositories.lists.getListSaveInfo(listId as string),
    enabled: !!listId,
    staleTime: 1000 * 30,
  });
}

export function useToggleListSave(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => container.repositories.lists.toggleListSave(listId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["list-save", listId] }),
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ListInput) => container.usecases.createList.execute(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });
}

export function useUpdateList(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ListInput) => container.usecases.updateList.execute(listId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list(listId) });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => container.usecases.deleteList.execute(listId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });
}

export function useAddToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { listId: string; tmdbId: number; detail?: SeriesDetail }) =>
      container.usecases.addToList.execute(input.listId, input.tmdbId, input.detail),
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list(input.listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.listItems(input.listId) });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

export function useRemoveFromList(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (seriesId: string) => container.usecases.removeFromList.execute(listId, seriesId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list(listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.listItems(listId) });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}
