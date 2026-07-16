import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { backdropUrl } from "@/data/tmdb/images";
import { airedEpisodeCount } from "@/domain/entities/Airing";
import type { Episode } from "@/domain/entities/Episode";
import { releaseYear } from "@/domain/entities/Series";
import { SERIES_STATUS_LABELS, type SeriesStatus } from "@/domain/entities/SeriesStatus";
import { SeasonAccordion } from "@/presentation/components/episodes/SeasonAccordion";
import { ReviewList } from "@/presentation/components/reviews/ReviewList";
import { ReviewSheet } from "@/presentation/components/reviews/ReviewSheet";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { SeriesStateCard } from "@/presentation/components/series/SeriesStateCard";
import { StatusPicker } from "@/presentation/components/series/StatusPicker";
import { Button } from "@/presentation/components/ui/Button";
import { RatingDisplay } from "@/presentation/components/ui/Rating";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { FullScreenSpinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useSeriesDetail } from "@/presentation/hooks/useDiscovery";
import { useOwnReview, useSeriesReviews } from "@/presentation/hooks/useReviews";
import {
  useLocalSeriesId,
  useRemoveFromLibrary,
  useSeasonProgress,
  useSeriesTracking,
  useSetSeriesStatus,
  useToggleEpisode,
  useToggleSeason,
  useWatchedEpisodes,
} from "@/presentation/hooks/useTracking";

function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Go back"
      className="tap-none flex size-10 items-center justify-center rounded-full bg-ink-950/60 text-mist-100 backdrop-blur-md active:bg-ink-900"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
        <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function SeriesDetailScreen() {
  const params = useParams<{ tmdbId: string }>();
  const tmdbId = Number(params.tmdbId);
  const { user } = useAuth();

  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<SeriesStatus | null>(null);

  const { data: detail, isLoading } = useSeriesDetail(tmdbId);
  const { data: seriesId } = useLocalSeriesId(tmdbId);
  const { data: tracking } = useSeriesTracking(seriesId ?? null);
  const { data: seasonProgress } = useSeasonProgress(seriesId ?? null);
  const { data: watchedIds } = useWatchedEpisodes(seriesId ?? null);
  const { data: reviews } = useSeriesReviews(seriesId ?? null);
  const { data: ownReview } = useOwnReview(seriesId ?? null);

  const setStatus = useSetSeriesStatus(tmdbId, detail);
  const removeFromLibrary = useRemoveFromLibrary(seriesId ?? null);
  const toggleEpisode = useToggleEpisode(seriesId ?? null);
  const toggleSeason = useToggleSeason(seriesId ?? null);

  if (isLoading || !detail) {
    return <FullScreenSpinner />;
  }

  const backdrop = backdropUrl(detail.backdropPath);
  const year = releaseYear(detail);
  const watched = watchedIds ?? new Set<number>();
  const totalWatched = seasonProgress?.reduce((sum, season) => sum + season.watchedEpisodes, 0) ?? 0;
  const airedEpisodes = airedEpisodeCount(detail);

  async function handleStatusChange(status: SeriesStatus) {
    setPendingStatus(status);

    try {
      await setStatus.mutateAsync(status);
      setStatusSheetOpen(false);
    } finally {
      setPendingStatus(null);
    }
  }

  async function handleRemove() {
    await removeFromLibrary.mutateAsync();
    setStatusSheetOpen(false);
  }

  function handleToggleEpisode(episode: Episode, next: boolean) {
    if (!seriesId) {
      return;
    }
    toggleEpisode.mutate({ episode, watched: next });
  }

  function handleToggleSeason(seasonNumber: number, episodes: Episode[], next: boolean) {
    if (!seriesId) {
      return;
    }
    toggleSeason.mutate({ seasonNumber, episodes, watched: next });
  }

  return (
    <>
      <div className="relative">
        <div className="relative h-[240px] w-full overflow-hidden bg-ink-800">
          {backdrop ? (
            <img src={backdrop} alt="" className="size-full object-cover opacity-50" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-ink-950/60 to-ink-950" />
        </div>

        <div className="pt-safe absolute inset-x-0 top-0 px-4">
          <div className="pt-3">
            <BackButton />
          </div>
        </div>

        <div className="relative -mt-24 flex items-end gap-4 px-5">
          <SeriesPoster path={detail.posterPath} alt={detail.name} className="w-[104px] shrink-0 shadow-xl" />
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="text-[22px] leading-tight font-bold text-mist-100">{detail.name}</h1>
            <p className="mt-1 text-[12px] text-mist-400">
              {[year, detail.tmdbStatus, `${detail.numberOfSeasons} seasons`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="flex gap-2">
          <Button
            variant={tracking ? "secondary" : "primary"}
            className="flex-1"
            loading={setStatus.isPending}
            onClick={() => setStatusSheetOpen(true)}
          >
            {tracking ? SERIES_STATUS_LABELS[tracking.status] : "Add to Library"}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            disabled={!seriesId}
            onClick={() => setReviewSheetOpen(true)}
          >
            {ownReview ? "Edit Review" : "Rate"}
          </Button>
        </div>

        {ownReview ? (
          <div className="mt-3 flex items-center gap-2">
            <RatingDisplay value={ownReview.rating} />
            <span className="text-[12px] text-mist-500">Your rating</span>
          </div>
        ) : null}

        <div className="mt-5">
          <SeriesStateCard
            detail={detail}
            watchedEpisodes={totalWatched}
            status={tracking?.status ?? null}
          />
        </div>

        {detail.overview ? (
          <p className="mt-5 text-[14px] leading-relaxed text-mist-300">{detail.overview}</p>
        ) : null}

        {detail.genres.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {detail.genres.map((genre) => (
              <span key={genre} className="rounded-full bg-ink-800 px-3 py-1 text-[11px] text-mist-400">
                {genre}
              </span>
            ))}
          </div>
        ) : null}

        <section className="mt-7">
          <h2 className="mb-1 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">Seasons</h2>
          {!seriesId ? (
            <p className="py-3 text-[13px] text-mist-500">
              Add this series to your library to start checking off episodes.
            </p>
          ) : null}
          <div>
            {detail.seasonsMeta.map((season) => (
              <SeasonAccordion
                key={season.seasonNumber}
                tmdbId={tmdbId}
                season={season}
                progress={seasonProgress?.find((item) => item.seasonNumber === season.seasonNumber)}
                watchedIds={watched}
                canTrack={!!seriesId}
                onToggleEpisode={handleToggleEpisode}
                onToggleSeason={handleToggleSeason}
              />
            ))}
          </div>
        </section>

        <section className="mt-7">
          <h2 className="mb-1 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">Reviews</h2>
          <ReviewList
            reviews={reviews ?? []}
            currentUserId={user?.id}
            emptyMessage="No reviews yet. Be the first."
          />
        </section>
      </div>

      <Sheet
        open={statusSheetOpen}
        onClose={() => setStatusSheetOpen(false)}
        title={tracking ? "Change Status" : "Add to Library"}
      >
        <StatusPicker
          value={tracking?.status ?? null}
          pending={setStatus.isPending || removeFromLibrary.isPending}
          pendingStatus={pendingStatus}
          airedEpisodes={airedEpisodes}
          onChange={handleStatusChange}
          onRemove={seriesId ? handleRemove : undefined}
        />
      </Sheet>

      <ReviewSheet
        open={reviewSheetOpen}
        onClose={() => setReviewSheetOpen(false)}
        seriesId={seriesId ?? null}
        seriesName={detail.name}
        existing={ownReview ?? null}
      />
    </>
  );
}
