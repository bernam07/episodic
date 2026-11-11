import { useState } from "react";
import { Link } from "react-router-dom";
import { posterUrl } from "@/data/tmdb/images";
import type { Review } from "@/domain/entities/Review";
import { RatingDisplay } from "@/presentation/components/ui/Rating";
import { useDeleteReview } from "@/presentation/hooks/useReviews";
import { useI18n } from "@/presentation/i18n/I18nProvider";

function ReviewBody({ review }: { review: Review }) {
  const { t } = useI18n();
  const [revealed, setRevealed] = useState(false);

  if (!review.body) {
    return null;
  }

  if (review.containsSpoilers && !revealed) {
    return (
      <div className="relative mt-2.5 overflow-hidden rounded-xl border border-white/[0.08] bg-ink-850 p-3">
        <p
          aria-hidden="true"
          className="line-clamp-3 text-[14px] leading-relaxed text-mist-400 blur-[6px] select-none"
        >
          {review.body}
        </p>
        <div className="absolute inset-0 flex items-center justify-center bg-ink-950/45 backdrop-blur-[2px]">
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="tap-none inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-ink-900/90 px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-md transition-colors hover:bg-ink-800 active:opacity-80"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5 text-accent-400">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>{t("spoilerTapToReveal")}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-[14px] leading-relaxed text-mist-300">{review.body}</p>
      {review.containsSpoilers ? (
        <button
          type="button"
          onClick={() => setRevealed(false)}
          className="tap-none mt-1.5 text-[11px] font-semibold text-mist-500 transition-colors hover:text-mist-300"
        >
          {t("hideSpoiler")}
        </button>
      ) : null}
    </div>
  );
}

type ReviewCardProps = {
  review: Review;
  showSeries?: boolean;
  canDelete?: boolean;
};

export function ReviewCard({ review, showSeries = false, canDelete = false }: ReviewCardProps) {
  const { t } = useI18n();
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
                  {review.author?.displayName || review.author?.username || "User"}
                </span>
              )}
              {review.rating !== null ? (
                <div className="mt-1">
                  <RatingDisplay value={review.rating} />
                </div>
              ) : null}
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
                {remove.isPending ? "…" : confirming ? t("confirmDelete") : t("delete")}
              </button>
            ) : null}
          </div>

          <ReviewBody review={review} />
        </div>
      </div>
    </li>
  );
}
