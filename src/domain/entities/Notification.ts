export type NotificationType = "follow" | "review";

export type AppNotification = {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actorId: string;
  actorUsername: string;
  actorDisplayName: string | null;
  actorAvatarUrl: string | null;
  seriesId: string | null;
  seriesTmdbId: number | null;
  seriesName: string | null;
  seriesPosterPath: string | null;
};
