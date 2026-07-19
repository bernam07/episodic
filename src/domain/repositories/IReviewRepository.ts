import type { RatingBucket } from "../entities/RatingSummary";
import type { Review } from "../entities/Review";

export type SubmitReviewInput = {
  seriesId: string;
  rating: number;
  body?: string | null;
  containsSpoilers?: boolean;
};

export interface IReviewRepository {
  getForSeries(seriesId: string): Promise<Review[]>;
  getOwnForSeries(seriesId: string): Promise<Review | null>;
  getOwn(): Promise<Review[]>;
  submit(input: SubmitReviewInput): Promise<Review>;
  remove(seriesId: string): Promise<void>;
  getRatingSummary(seriesId: string): Promise<RatingBucket[]>;
}
