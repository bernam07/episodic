export function shouldResetCache(
  previousUserId: string | null | undefined,
  nextUserId: string | null
): boolean {
  if (previousUserId === undefined) {
    return false;
  }

  return previousUserId !== nextUserId;
}
