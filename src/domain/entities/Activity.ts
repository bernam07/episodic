export type ActivityEventType = "started" | "finished" | "progress" | "reviewed";

export type ActivityEvent = {
  actorId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  eventType: ActivityEventType;
  seriesId: string;
  tmdbId: number;
  seriesName: string;
  posterPath: string | null;
  occurredAt: string;
  episodeCount: number | null;
  rating: number | null;
  reviewBody: string | null;
};

export function activityVerb(event: ActivityEvent): string {
  switch (event.eventType) {
    case "started":
      return "started watching";
    case "finished":
      return "finished";
    case "reviewed":
      return "reviewed";
    case "progress": {
      const count = event.episodeCount ?? 0;
      return `watched ${count} ${count === 1 ? "episode" : "episodes"} of`;
    }
  }
}
