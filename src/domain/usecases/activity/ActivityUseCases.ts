import type { ActivityEvent } from "@/domain/entities/Activity";
import type { IActivityRepository } from "@/domain/repositories/IActivityRepository";

export class GetFriendsFeed {
  constructor(private readonly activity: IActivityRepository) {}

  async execute(limit = 40): Promise<ActivityEvent[]> {
    return this.activity.getFriendsFeed(limit);
  }
}

export class GetUserDiary {
  constructor(private readonly activity: IActivityRepository) {}

  async execute(userId: string, limit = 40): Promise<ActivityEvent[]> {
    return this.activity.getUserDiary(userId, limit);
  }
}
