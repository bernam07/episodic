import type { AppNotification } from "../entities/Notification";

export interface INotificationRepository {
  getNotifications(limit?: number): Promise<AppNotification[]>;
  getUnreadCount(): Promise<number>;
  markAllRead(): Promise<void>;
}
