import type { ActivityEvent } from "../entities/Activity";

export interface IActivityRepository {
  getFriendsFeed(limit?: number): Promise<ActivityEvent[]>;
  getUserDiary(userId: string, limit?: number): Promise<ActivityEvent[]>;
}
