import { AppError } from "@/core/errors/AppError";
import { isValidRating, type Review } from "@/domain/entities/Review";
import type { IReviewRepository, SubmitReviewInput } from "@/domain/repositories/IReviewRepository";

const MAX_BODY_LENGTH = 2000;

export class SubmitReview {
  constructor(private readonly reviews: IReviewRepository) {}

  async execute(input: SubmitReviewInput): Promise<Review> {
    if (!isValidRating(input.rating)) {
      throw new AppError("validation", "Rating must be between 0.5 and 5 in half-star steps.");
    }

    const body = input.body?.trim() ?? null;

    if (body && body.length > MAX_BODY_LENGTH) {
      throw new AppError("validation", `Review must be ${MAX_BODY_LENGTH} characters or fewer.`);
    }

    return this.reviews.submit({ ...input, body: body || null });
  }
}

export class GetSeriesReviews {
  constructor(private readonly reviews: IReviewRepository) {}

  async execute(seriesId: string): Promise<Review[]> {
    return this.reviews.getForSeries(seriesId);
  }
}

export class GetOwnReview {
  constructor(private readonly reviews: IReviewRepository) {}

  async execute(seriesId: string): Promise<Review | null> {
    return this.reviews.getOwnForSeries(seriesId);
  }
}

export class GetOwnReviews {
  constructor(private readonly reviews: IReviewRepository) {}

  async execute(): Promise<Review[]> {
    return this.reviews.getOwn();
  }
}

export class DeleteReview {
  constructor(private readonly reviews: IReviewRepository) {}

  async execute(seriesId: string): Promise<void> {
    return this.reviews.remove(seriesId);
  }
}
