import type { AppNotification } from "@/domain/entities/Notification";
import type { INotificationRepository } from "@/domain/repositories/INotificationRepository";

export class GetNotifications {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(limit = 50): Promise<AppNotification[]> {
    return this.notifications.getNotifications(limit);
  }
}

export class GetUnreadCount {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(): Promise<number> {
    return this.notifications.getUnreadCount();
  }
}

export class MarkNotificationsRead {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(): Promise<void> {
    return this.notifications.markAllRead();
  }
}
