export interface IPushRepository {
  isEnabled(): Promise<boolean>;
  enable(): Promise<boolean>;
  disable(): Promise<void>;
  notifyFollow(followingId: string): Promise<void>;
  notifyReview(seriesId: string): Promise<void>;
}
