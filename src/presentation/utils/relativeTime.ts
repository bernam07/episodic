export function relativeTime(value: string): string {
  const then = new Date(value).getTime();

  if (Number.isNaN(then)) {
    return "";
  }

  const seconds = Math.max(Math.floor((Date.now() - then) / 1000), 0);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
