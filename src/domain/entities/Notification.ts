export type NotificationType = "follow" | "review" | "new_episode";

export type AppNotification = {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actorId: string | null;
  actorUsername: string | null;
  actorDisplayName: string | null;
  actorAvatarUrl: string | null;
  seriesId: string | null;
  seriesTmdbId: number | null;
  seriesName: string | null;
  seriesPosterPath: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
};
