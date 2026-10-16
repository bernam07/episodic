import type { Review } from "@/domain/entities/Review";
import { ReviewCard } from "./ReviewCard";

type ReviewListProps = {
  reviews: Review[];
  currentUserId?: string | null;
  showSeries?: boolean;
  emptyMessage?: string;
};

export function ReviewList({
  reviews,
  currentUserId = null,
  showSeries = false,
  emptyMessage = "No reviews yet.",
}: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className="py-6 text-center text-[0.9375rem] text-mist-500">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-white/[0.08]">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          showSeries={showSeries}
          canDelete={!!currentUserId && review.userId === currentUserId}
        />
      ))}
    </ul>
  );
}
