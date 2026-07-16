import { useState } from "react";
import { Link } from "react-router-dom";
import { posterUrl } from "@/data/tmdb/images";
import type { Review } from "@/domain/entities/Review";
import { RatingDisplay } from "@/presentation/components/ui/Rating";
import { useDeleteReview } from "@/presentation/hooks/useReviews";

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
        className="tap-none mt-2 w-full rounded-lg bg-ink-800 py-3 text-[13px] font-medium text-mist-400 active:bg-ink-700"
      >
        Contains spoilers — tap to reveal
      </button>
    );
  }

  return <p className="mt-2 text-[14px] leading-relaxed text-mist-300">{review.body}</p>;
}

type ReviewCardProps = {
  review: Review;
  showSeries?: boolean;
  canDelete?: boolean;
};

export function ReviewCard({ review, showSeries = false, canDelete = false }: ReviewCardProps) {
  const [confirming, setConfirming] = useState(false);
  const remove = useDeleteReview();
  const poster = posterUrl(review.series?.posterPath ?? null, "w154");

  return (
    <li className="py-4">
      <div className="flex items-start gap-3">
        {showSeries && review.series ? (
          <Link to={`/series/${review.series.tmdbId}`} className="tap-none shrink-0 active:opacity-70">
            <div className="h-[72px] w-12 overflow-hidden rounded-lg bg-ink-800">
              {poster ? (
                <img src={poster} alt="" loading="lazy" className="size-full object-cover" />
              ) : null}
            </div>
          </Link>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {showSeries && review.series ? (
                <Link
                  to={`/series/${review.series.tmdbId}`}
                  className="block truncate text-[14px] font-semibold text-mist-100"
                >
                  {review.series.name}
                </Link>
              ) : (
                <span className="block truncate text-[14px] font-semibold text-mist-100">
                  {review.author?.displayName || review.author?.username || "Someone"}
                </span>
              )}
              <div className="mt-1">
                <RatingDisplay value={review.rating} />
              </div>
            </div>

            {canDelete ? (
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => (confirming ? remove.mutate(review.seriesId) : setConfirming(true))}
                onBlur={() => setConfirming(false)}
                className={`tap-none shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50 ${
                  confirming ? "bg-danger-500 text-white" : "text-mist-500 active:bg-ink-800"
                }`}
              >
                {remove.isPending ? "Deleting…" : confirming ? "Confirm delete" : "Delete"}
              </button>
            ) : null}
          </div>

          <ReviewBody review={review} />
        </div>
      </div>
    </li>
  );
}
