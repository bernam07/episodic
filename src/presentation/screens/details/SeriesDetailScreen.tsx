import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { backdropUrl } from "@/data/tmdb/images";
import { airedEpisodeCount } from "@/domain/entities/Airing";
import type { Episode } from "@/domain/entities/Episode";
import { releaseYear } from "@/domain/entities/Series";
import { SERIES_STATUS_LABELS, type SeriesStatus } from "@/domain/entities/SeriesStatus";
import { ActorDetailSheet } from "@/presentation/components/actors/ActorDetailSheet";
import { SeasonAccordion } from "@/presentation/components/episodes/SeasonAccordion";
import { AddToListSheet } from "@/presentation/components/lists/AddToListSheet";
import { MoreLikeThisRail } from "@/presentation/components/series/MoreLikeThisRail";
import { SeriesCastRail } from "@/presentation/components/series/SeriesCastRail";
import { WatchProvidersSection } from "@/presentation/components/series/WatchProvidersSection";
import { RatingSummaryCard } from "@/presentation/components/reviews/RatingSummaryCard";
import { ReviewList } from "@/presentation/components/reviews/ReviewList";
import { ReviewSheet } from "@/presentation/components/reviews/ReviewSheet";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { SeriesStateCard } from "@/presentation/components/series/SeriesStateCard";
import { ShareCardSheet } from "@/presentation/components/series/ShareCardSheet";
import { StatusPicker } from "@/presentation/components/series/StatusPicker";
import { Button } from "@/presentation/components/ui/Button";
import { RatingInput } from "@/presentation/components/ui/Rating";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { FullScreenSpinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useCredits, useSeriesDetail } from "@/presentation/hooks/useDiscovery";
import { useOwnReview, useRatingSummary, useSeriesReviews } from "@/presentation/hooks/useReviews";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import { useToast } from "@/presentation/providers/ToastProvider";
import {
  useBumpRewatch,
  useLocalSeriesId,
  useRemoveFromLibrary,
  useSeasonProgress,
  useSeriesTracking,
  useSetRating,
  useSetSeriesStatus,
  useToggleEpisode,
  useToggleFavorite,
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
      className="ios-material tap-none flex size-9 items-center justify-center rounded-full border border-white/10 text-white active:opacity-70"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-5">
        <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function SeriesDetailScreen() {
  const { t } = useI18n();
  const toast = useToast();
  const params = useParams<{ tmdbId: string }>();
  const tmdbId = Number(params.tmdbId);
  const { user } = useAuth();

  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<SeriesStatus | null>(null);
  const [selectedActor, setSelectedActor] = useState<{ id: number; name: string } | null>(null);

  const { data: detail, isLoading } = useSeriesDetail(tmdbId);
  const { data: seriesId } = useLocalSeriesId(tmdbId);
  const { data: tracking } = useSeriesTracking(seriesId ?? null);
  const { data: seasonProgress } = useSeasonProgress(seriesId ?? null);
  const { data: watchedIds } = useWatchedEpisodes(seriesId ?? null);
  const { data: reviews } = useSeriesReviews(seriesId ?? null);
  const { data: ownReview } = useOwnReview(seriesId ?? null);
  const { data: ratingSummary } = useRatingSummary(seriesId ?? null);
  const { data: cast } = useCredits(tmdbId);

  const setStatus = useSetSeriesStatus(tmdbId, detail);
  const removeFromLibrary = useRemoveFromLibrary(seriesId ?? null);
  const toggleEpisode = useToggleEpisode(seriesId ?? null);
  const toggleSeason = useToggleSeason(seriesId ?? null);
  const toggleFavorite = useToggleFavorite(seriesId ?? null);
  const bumpRewatch = useBumpRewatch(seriesId ?? null);
  const setRating = useSetRating(seriesId ?? null);

  const [todayMs] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  });

  const nextEpisode = detail?.nextEpisodeToAir;
  const nextAir = useMemo(() => {
    if (!nextEpisode?.airDate) return null;
    const date = new Date(nextEpisode.airDate + "T00:00:00");
    const diffMs = date.getTime() - todayMs;
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return {
      seasonNumber: nextEpisode.seasonNumber,
      episodeNumber: nextEpisode.episodeNumber,
      days,
    };
  }, [nextEpisode, todayMs]);

  if (isLoading || !detail) {
    return <FullScreenSpinner />;
  }

  const backdrop = backdropUrl(detail.backdropPath);
  const year = releaseYear(detail);
  const watched = watchedIds ?? new Set<number>();
  const totalWatched = seasonProgress?.reduce((sum, season) => sum + season.watchedEpisodes, 0) ?? 0;
  const airedEpisodes = airedEpisodeCount(detail);
  const isFavorite = tracking?.isFavorite ?? false;

  async function handleStatusChange(status: SeriesStatus) {
    setPendingStatus(status);

    try {
      await setStatus.mutateAsync(status);
      toast.success(t("statusUpdatedToast", { status: SERIES_STATUS_LABELS[status] }));
      setStatusSheetOpen(false);
    } finally {
      setPendingStatus(null);
    }
  }

  async function handleRemove() {
    await removeFromLibrary.mutateAsync();
    toast.show(t("removedFromLibraryToast"));
    setStatusSheetOpen(false);
  }

  async function handleToggleFavorite() {
    await toggleFavorite.mutateAsync();
    toast.show(!isFavorite ? t("addedToFavoritesToast") : t("removedFromFavoritesToast"));
  }

  async function handleBumpRewatch(delta: number) {
    await bumpRewatch.mutateAsync(delta);
    toast.show(delta > 0 ? t("rewatchAddedToast") : t("rewatchRemovedToast"));
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
        <div className="relative h-[300px] w-full overflow-hidden bg-ink-900 md:h-[380px]">
          {backdrop ? (
            <img src={backdrop} alt="" className="size-full object-cover opacity-70" />
          ) : null}
          <div className="hero-scrim absolute inset-0" />
        </div>

        <div className="pt-safe absolute inset-x-0 top-0 px-4">
          <div className="flex items-center justify-between pt-3">
            <BackButton />
            <div className="flex items-center gap-2">
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(detail.name + " official trailer")}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("watchTrailer")}
                title={t("watchTrailer")}
                className="ios-material tap-none flex size-9 items-center justify-center rounded-full border border-white/10 text-danger-500 transition-opacity active:opacity-70"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
              </a>
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                aria-label="Share a card"
                className="ios-material tap-none flex size-9 items-center justify-center rounded-full border border-white/10 text-white transition-opacity active:opacity-70"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[19px]">
                  <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 15V3M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="relative -mt-28 flex items-end gap-4 px-5">
          <SeriesPoster path={detail.posterPath} alt={detail.name} className="w-[112px] shrink-0 shadow-2xl shadow-black/80" />
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="text-[1.5rem] leading-[1.15] font-bold tracking-[-0.022em] text-white">{detail.name}</h1>
            <p className="mt-1 text-[0.8125rem] font-medium text-mist-400">
              {[year, detail.tmdbStatus, `${detail.numberOfSeasons} ${t("seasons")}`].filter(Boolean).join(" · ")}
            </p>
            {nextAir ? (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-500/15 px-2.5 py-1 text-[0.6875rem] font-semibold text-accent-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>
                  S{nextAir.seasonNumber}E{nextAir.episodeNumber} ·{" "}
                  {nextAir.days === 0
                    ? t("airsToday")
                    : nextAir.days === 1
                      ? t("airsTomorrow")
                      : t("airsInDays", { days: nextAir.days })}
                </span>
              </div>
            ) : null}
            {detail.voteAverage && detail.voteAverage > 0 ? (
              <div className="mt-2 flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-ink-850 px-2.5 py-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-3 text-star-500">
                  <path d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z" />
                </svg>
                <span className="text-[0.8125rem] font-semibold tabular-nums text-white">{detail.voteAverage.toFixed(1)}</span>
                <span className="text-[0.6875rem] font-medium text-mist-500">/10 · TMDB</span>
              </div>
            ) : null}
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
            {tracking ? SERIES_STATUS_LABELS[tracking.status] : t("addToLibrary")}
          </Button>

          {seriesId ? (
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={toggleFavorite.isPending}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className={`tap-none flex size-[44px] shrink-0 items-center justify-center rounded-[12px] transition-colors active:opacity-80 ${
                isFavorite
                  ? "bg-danger-500/15 text-danger-500"
                  : "bg-ink-800 text-mist-300 hover:bg-ink-700 hover:text-white"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setAddToListOpen(true)}
            aria-label="Add to list"
            className="tap-none flex size-[44px] shrink-0 items-center justify-center rounded-[12px] bg-ink-800 text-mist-300 transition-colors active:opacity-80 hover:bg-ink-700 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <path d="M4 6h11M4 12h11M4 18h7M17 15v6M14 18h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {seriesId ? (
          <div className="mt-4 flex items-center justify-between rounded-[14px] border border-white/[0.07] bg-ink-850 p-3.5">
            <RatingInput
              value={tracking?.rating ?? 0}
              onChange={(rating) => setRating.mutate(rating || null)}
            />
            <button
              type="button"
              onClick={() => setReviewSheetOpen(true)}
              className="tap-none text-[0.9375rem] font-normal text-accent-500 transition-opacity active:opacity-70"
            >
              {ownReview?.body ? t("editReview") : t("writeReview")}
            </button>
          </div>
        ) : null}

        {tracking ? (
          <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-ink-850 px-4 py-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 shrink-0 text-mist-400">
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="min-w-0 flex-1 text-[0.875rem] text-mist-300">
              {(tracking.rewatchCount ?? 0) > 0 ? (
                <>
                  {t("rewatched")} <span className="font-semibold text-white">{tracking.rewatchCount}×</span>
                </>
              ) : (
                t("logRewatch")
              )}
            </span>
            {(tracking.rewatchCount ?? 0) > 0 ? (
              <button
                type="button"
                onClick={() => handleBumpRewatch(-1)}
                disabled={bumpRewatch.isPending}
                aria-label="Remove a rewatch"
                className="tap-none flex size-8 items-center justify-center rounded-full bg-ink-800 text-mist-300 active:bg-ink-700 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4">
                  <path d="M5 12h14" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => handleBumpRewatch(1)}
              disabled={bumpRewatch.isPending}
              aria-label="Add a rewatch"
              className="tap-none flex size-8 items-center justify-center rounded-full bg-accent-500 text-white active:opacity-80 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </button>
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
          <p className="mt-5 text-[0.9375rem] text-mist-300">{detail.overview}</p>
        ) : null}

        {detail.genres.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {detail.genres.map((genre) => (
              <span key={genre} className="rounded-full border border-white/[0.07] bg-ink-850 px-3 py-1 text-[0.75rem] font-medium text-mist-300">
                {genre}
              </span>
            ))}
          </div>
        ) : null}

        <WatchProvidersSection tmdbId={tmdbId} />
      </div>

      <SeriesCastRail cast={cast ?? []} onSelectActor={setSelectedActor} />

      <div className="px-5">
        <section className="mt-7">
          <h2 className="mb-2 text-[1.1875rem] font-bold tracking-[-0.015em] text-white">{t("seasons")}</h2>
          {!seriesId ? (
            <p className="py-3 text-[0.875rem] text-mist-500">
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
          <h2 className="mb-2 text-[1.1875rem] font-bold tracking-[-0.015em] text-white">{t("reviews")}</h2>
          {ratingSummary && ratingSummary.total > 0 ? (
            <div className="mb-4 mt-2">
              <RatingSummaryCard summary={ratingSummary} />
            </div>
          ) : null}
          <ReviewList
            reviews={reviews ?? []}
            currentUserId={user?.id}
            emptyMessage="No reviews yet. Be the first."
          />
        </section>
      </div>

      <MoreLikeThisRail tmdbId={tmdbId} />

      <Sheet
        open={statusSheetOpen}
        onClose={() => setStatusSheetOpen(false)}
        title={tracking ? t("changeStatus") : t("addToLibrary")}
      >
        <StatusPicker
          value={tracking?.status ?? null}
          pending={setStatus.isPending || removeFromLibrary.isPending}
          pendingStatus={pendingStatus}
          airedEpisodes={airedEpisodes}
          watchedEpisodes={totalWatched}
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

      <ActorDetailSheet
        open={selectedActor !== null}
        onClose={() => setSelectedActor(null)}
        personId={selectedActor?.id ?? null}
        personName={selectedActor?.name ?? ""}
      />

      <AddToListSheet
        open={addToListOpen}
        onClose={() => setAddToListOpen(false)}
        tmdbId={tmdbId}
        detail={detail}
      />

      <ShareCardSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        posterPath={detail.posterPath}
        backdropPath={detail.backdropPath}
        backdrops={detail.backdrops}
        name={detail.name}
        year={year ? String(year) : null}
        rating={tracking?.rating ?? null}
      />
    </>
  );
}
