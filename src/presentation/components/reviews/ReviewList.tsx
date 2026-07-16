import { useState } from "react";
import type { Review } from "@/domain/entities/Review";
import { RatingDisplay } from "@/presentation/components/ui/Rating";

function ReviewBody({ review }: { review: Review }) {
  const [revealed, setRevealed] = useState(false);

  if (!review.body) {
    return null;
  }

  if (review.containsSpoilers && !revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="tap-none mt-1.5 w-full rounded-lg bg-ink-800 py-3 text-[13px] font-medium text-mist-400 active:bg-ink-700"
      >
        Contains spoilers — tap to reveal
      </button>
    );
  }

  return <p className="mt-1.5 text-[14px] leading-relaxed text-mist-300">{review.body}</p>;
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="py-6 text-center text-[14px] text-mist-500">No reviews yet.</p>;
  }

  return (
    <ul className="divide-y divide-ink-800">
      {reviews.map((review) => (
        <li key={review.id} className="py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-[14px] font-semibold text-mist-100">
              {review.author?.displayName || review.author?.username || "Someone"}
            </span>
            <RatingDisplay value={review.rating} />
          </div>
          <ReviewBody review={review} />
        </li>
      ))}
    </ul>
  );
}
