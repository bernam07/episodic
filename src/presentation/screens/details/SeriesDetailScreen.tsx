import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { backdropUrl } from "@/data/tmdb/images";
import { airedEpisodeCount, hasUpcomingSeason } from "@/domain/entities/Airing";
import type { Episode } from "@/domain/entities/Episode";
import { releaseYear } from "@/domain/entities/Series";
import {
  formatSeriesStatusLabel,
  resolveDisplayStatus,
  type DisplaySeriesStatus,
  type SeriesStatus,
} from "@/domain/entities/SeriesStatus";
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
  useSyncSeriesDetailProgress,
  useToggleEpisode,
  useToggleFavorite,
  useToggleSeason,
  useWatchedEpisodes,
} from "@/presentation/hooks/useTracking";

type DetailTab = "episodes" | "about" | "reviews";

const STATUS_DOT_COLOR: Record<DisplaySeriesStatus, string> = {
  watching: "bg-accent-500",
  up_to_date: "bg-[#38bdf8]",
  want_to_watch: "bg-[#ffd60a]",
  watched: "bg-[#30d158]",
  abandoned: "bg-danger-500",
};

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

  const [activeTab, setActiveTab] = useState<DetailTab>("episodes");
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [ratingDrawerOpen, setRatingDrawerOpen] = useState(false);
  const [rewatchDrawerOpen, setRewatchDrawerOpen] = useState(false);
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

  const syncedWatchedCount = seasonProgress
    ? seasonProgress.reduce((sum, season) => sum + season.watchedEpisodes, 0)
    : null;
  useSyncSeriesDetailProgress(seriesId ?? null, detail, tracking, syncedWatchedCount);

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
  const targetTotal = airedEpisodes > 0 ? airedEpisodes : detail.numberOfEpisodes;
  const hasUnaired = hasUpcomingSeason(detail.seasonsMeta, detail.tmdbStatus);
  const isFavorite = tracking?.isFavorite ?? false;
  const rewatchCount = tracking?.rewatchCount ?? 0;
  const fallbackTrailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    detail.name + " official trailer"
  )}`;

  const displayStatus: DisplaySeriesStatus | null = tracking
    ? resolveDisplayStatus({
        status: tracking.status,
        tmdbStatus: detail.tmdbStatus,
        hasUnairedSeason: hasUnaired,
        airedEpisodes,
        numberOfEpisodes: detail.numberOfEpisodes,
        inProduction: detail.inProduction,
        hasNextEpisode: Boolean(detail.nextEpisodeToAir),
        watchedEpisodes: totalWatched,
      })
    : null;

  const displayStatusLabels: Record<DisplaySeriesStatus, string> = {
    watching: t("watching"),
    up_to_date: t("upToDate"),
    want_to_watch: t("wantToWatch"),
    watched: t("watched"),
    abandoned: t("abandoned"),
  };

  async function handleStatusChange(status: SeriesStatus) {
    setPendingStatus(status);

    try {
      await setStatus.mutateAsync(status);
      toast.success(
        t("statusUpdatedToast", {
          status: formatSeriesStatusLabel(status, detail?.tmdbStatus, t("upToDate"), {
            hasUnairedSeason: hasUnaired,
            airedEpisodes,
            numberOfEpisodes: detail?.numberOfEpisodes,
            inProduction: detail?.inProduction,
            hasNextEpisode: Boolean(detail?.nextEpisodeToAir),
          }),
        })
      );
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

  const metaParts: string[] = [];
  if (year) metaParts.push(String(year));
  metaParts.push(
    `${detail.numberOfSeasons} ${detail.numberOfSeasons === 1 ? t("season").toLowerCase() : t("seasons").toLowerCase()}`
  );
  if (detail.genres.length > 0) {
    metaParts.push(detail.genres.slice(0, 2).join(", "));
  }

  return (
    <>
      <div className="relative">
        <div className="ambient-cinema-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[440px]" />
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-8 -z-10 h-[360px] w-full object-cover opacity-30 blur-3xl saturate-150"
          />
        ) : null}

        <div className="relative h-[248px] w-full overflow-hidden bg-ink-900 md:h-[320px]">
          {backdrop ? (
            <img src={backdrop} alt="" className="size-full object-cover opacity-75" />
          ) : null}
          <div className="hero-scrim absolute inset-0" />
        </div>

        <div className="pt-safe absolute inset-x-0 top-0 px-4">
          <div className="flex items-center justify-between pt-3">
            <BackButton />
            <div className="flex items-center gap-2">
              {seriesId ? (
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={toggleFavorite.isPending}
                  aria-pressed={isFavorite}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  className={`ios-material tap-none flex size-9 items-center justify-center rounded-full border border-white/10 transition-opacity active:opacity-70 ${
                    isFavorite ? "text-accent-500" : "text-white"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-[18px]"
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
                onClick={() => setShareOpen(true)}
                aria-label="Share a card"
                className="ios-material tap-none flex size-9 items-center justify-center rounded-full border border-white/10 text-white transition-opacity active:opacity-70"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]">
                  <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 15V3M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="relative -mt-24 flex items-end gap-4 px-5">
          <SeriesPoster
            path={detail.posterPath}
            alt={detail.name}
            className="w-[88px] shrink-0 shadow-2xl shadow-black/90 sm:w-[100px]"
          />
          <div className="min-w-0 flex-1 pb-0.5">
            {nextAir ? (
              <div className="mb-1.5 inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-[#38bdf8]">
                <span className="size-1.5 rounded-full bg-[#38bdf8]" />
                <span>
                  S{nextAir.seasonNumber}E{nextAir.episodeNumber} ·{" "}
                  {nextAir.days === 0
                    ? t("airsToday")
                    : nextAir.days === 1
                      ? t("airsTomorrow")
                      : t("airsInDays", { days: nextAir.days })}
                </span>
              </div>
            ) : detail.tmdbStatus ? (
              <div className="mb-1 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-mist-400">
                <span className="size-1.5 rounded-full bg-mist-500" />
                <span>{detail.tmdbStatus}</span>
              </div>
            ) : null}

            <h1 className="text-[1.375rem] leading-[1.15] font-extrabold tracking-[-0.025em] text-white sm:text-[1.5rem]">
              {detail.name}
            </h1>

            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.75rem] text-mist-400">
              <span>{metaParts.join(" · ")}</span>
              {detail.voteAverage && detail.voteAverage > 0 ? (
                <span className="font-semibold tabular-nums text-white">
                  · <span className="text-star-500">★</span> {detail.voteAverage.toFixed(1)}
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={setStatus.isPending}
            onClick={() => setStatusSheetOpen(true)}
            className="tap-none flex min-h-[44px] flex-1 items-center justify-between gap-2.5 rounded-[12px] border border-white/[0.1] bg-ink-850 px-3.5 text-[0.875rem] font-semibold text-white transition-colors hover:bg-ink-800 active:opacity-80 disabled:opacity-50"
          >
            <span className="flex min-w-0 items-center gap-2">
              {displayStatus ? (
                <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT_COLOR[displayStatus]}`} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="size-4 shrink-0 text-accent-400">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              )}
              <span className="truncate">
                {displayStatus ? displayStatusLabels[displayStatus] : t("addToLibrary")}
              </span>
              {tracking && targetTotal > 0 ? (
                <span className="shrink-0 text-[0.75rem] font-normal tabular-nums text-mist-500">
                  · {totalWatched}/{targetTotal}
                </span>
              ) : null}
            </span>

            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4 shrink-0 text-mist-400">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {detail.trailerKey ? (
            <button
              type="button"
              onClick={() => setTrailerOpen(true)}
              aria-label={t("watchTrailer")}
              className="glow-accent-sm tap-none flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-[12px] bg-accent-500 px-4 text-[0.8125rem] font-bold text-white transition-all hover:bg-accent-400 active:opacity-85"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Trailer</span>
            </button>
          ) : (
            <a
              href={fallbackTrailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("watchTrailer")}
              className="glow-accent-sm tap-none flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-[12px] bg-accent-500 px-4 text-[0.8125rem] font-bold text-white transition-all hover:bg-accent-400 active:opacity-85"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Trailer</span>
            </a>
          )}
        </div>

        <div className="mt-2.5 grid grid-cols-4 divide-x divide-white/[0.06] rounded-[12px] border border-white/[0.07] bg-ink-900/90 py-2">
          <button
            type="button"
            aria-expanded={ratingDrawerOpen}
            onClick={() => {
              if (!seriesId) {
                setStatusSheetOpen(true);
                return;
              }
              setRatingDrawerOpen((open) => !open);
              setRewatchDrawerOpen(false);
            }}
            className="tap-none flex flex-col items-center justify-center gap-0.5 py-0.5 text-center transition-opacity active:opacity-70"
          >
            <span className="flex items-center gap-1 text-[0.8125rem] font-bold tabular-nums text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5 text-star-500">
                <path d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z" />
              </svg>
              {tracking?.rating ? tracking.rating.toFixed(1) : "—"}
            </span>
            <span className="text-[0.6875rem] font-medium text-mist-500">{t("rate")}</span>
          </button>

          <button
            type="button"
            onClick={() => (seriesId ? setReviewSheetOpen(true) : setStatusSheetOpen(true))}
            className="tap-none flex flex-col items-center justify-center gap-0.5 py-0.5 text-center transition-opacity active:opacity-70"
          >
            <span className="relative flex h-[19px] items-center justify-center text-mist-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
              </svg>
              {ownReview?.body ? (
                <span className=" -top-0.5 -right-1.5 absolute size-1.5 rounded-full bg-accent-500" />
              ) : null}
            </span>
            <span className="text-[0.6875rem] font-medium text-mist-500">{t("reviews")}</span>
          </button>

          <button
            type="button"
            onClick={() => setAddToListOpen(true)}
            className="tap-none flex flex-col items-center justify-center gap-0.5 py-0.5 text-center transition-opacity active:opacity-70"
          >
            <span className="flex h-[19px] items-center justify-center text-mist-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-[0.6875rem] font-medium text-mist-500">{t("myList")}</span>
          </button>

          <button
            type="button"
            aria-expanded={rewatchDrawerOpen}
            disabled={bumpRewatch.isPending}
            onClick={() => {
              if (!tracking) {
                setStatusSheetOpen(true);
                return;
              }
              if (rewatchCount === 0) {
                handleBumpRewatch(1);
              } else {
                setRewatchDrawerOpen((open) => !open);
                setRatingDrawerOpen(false);
              }
            }}
            className="tap-none flex flex-col items-center justify-center gap-0.5 py-0.5 text-center transition-opacity active:opacity-70 disabled:opacity-50"
          >
            <span className="text-[0.8125rem] font-bold tabular-nums text-white">
              {rewatchCount > 0 ? `${rewatchCount}×` : "+1×"}
            </span>
            <span className="text-[0.6875rem] font-medium text-mist-500">{t("rewatch")}</span>
          </button>
        </div>

        {seriesId && ratingDrawerOpen ? (
          <div className="mt-2.5 flex items-center justify-between rounded-[12px] border border-white/[0.08] bg-ink-850 px-3.5 py-2.5">
            <RatingInput
              value={tracking?.rating ?? 0}
              onChange={(rating) => setRating.mutate(rating || null)}
            />
            <button
              type="button"
              onClick={() => setReviewSheetOpen(true)}
              className="tap-none text-[0.75rem] font-semibold text-accent-400 hover:text-accent-300"
            >
              {ownReview?.body ? t("editReview") : t("writeReview")}
            </button>
          </div>
        ) : null}

        {tracking && rewatchDrawerOpen ? (
          <div className="mt-2.5 flex items-center justify-between rounded-[12px] border border-white/[0.08] bg-ink-850 px-3.5 py-2.5">
            <span className="text-[0.8125rem] text-mist-300">
              {t("rewatched")} <strong className="font-bold text-white">{rewatchCount}×</strong>
            </span>
            <div className="flex items-center gap-2">
              {rewatchCount > 0 ? (
                <button
                  type="button"
                  onClick={() => handleBumpRewatch(-1)}
                  disabled={bumpRewatch.isPending}
                  aria-label="Remove a rewatch"
                  className="tap-none flex size-7 items-center justify-center rounded-full bg-ink-800 text-mist-300 active:bg-ink-700 disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
                    <path d="M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => handleBumpRewatch(1)}
                disabled={bumpRewatch.isPending}
                aria-label="Add a rewatch"
                className="tap-none flex size-7 items-center justify-center rounded-full bg-accent-500 text-white active:opacity-80 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex gap-6 border-b border-white/[0.08]">
          {(
            [
              { id: "episodes", label: `${t("seasons")} (${detail.seasonsMeta.length})` },
              { id: "about", label: t("aboutAndCast") },
              {
                id: "reviews",
                label:
                  reviews && reviews.length > 0
                    ? `${t("reviews")} (${reviews.length})`
                    : t("reviews"),
              },
            ] as { id: DetailTab; label: string }[]
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`tap-none relative py-2.5 text-[0.875rem] font-semibold transition-colors ${
                  active ? "text-white" : "text-mist-500 hover:text-mist-300"
                }`}
              >
                {tab.label}
                {active ? (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-white" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "episodes" ? (
        <div className="px-5 pt-4">
          <SeriesStateCard
            detail={detail}
            watchedEpisodes={totalWatched}
            status={tracking?.status ?? null}
          />

          <section className="mt-4">
            {!seriesId ? (
              <p className="py-2 text-[0.8125rem] text-mist-500">
                {t("addSeriesPrompt")}
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
        </div>
      ) : null}

      {activeTab === "about" ? (
        <div className="pt-4">
          <div className="px-5">
            {detail.overview ? (
              <p className="text-[0.875rem] leading-relaxed text-mist-300">{detail.overview}</p>
            ) : (
              <p className="text-[0.875rem] text-mist-500">{t("noDescription")}</p>
            )}
            <WatchProvidersSection tmdbId={tmdbId} />
          </div>

          <SeriesCastRail cast={cast ?? []} onSelectActor={setSelectedActor} />
          <MoreLikeThisRail tmdbId={tmdbId} />
        </div>
      ) : null}

      {activeTab === "reviews" ? (
        <div className="px-5 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[1rem] font-bold text-white">{t("reviews")}</h2>
            {seriesId ? (
              <button
                type="button"
                onClick={() => setReviewSheetOpen(true)}
                className="tap-none rounded-full border border-white/10 bg-ink-850 px-3 py-1 text-[0.75rem] font-semibold text-white hover:bg-ink-800"
              >
                {ownReview?.body ? t("editReview") : t("writeReview")}
              </button>
            ) : null}
          </div>

          {ratingSummary && ratingSummary.total > 0 ? (
            <div className="mb-4">
              <RatingSummaryCard summary={ratingSummary} />
            </div>
          ) : null}

          <ReviewList
            reviews={reviews ?? []}
            currentUserId={user?.id}
            emptyMessage={t("noReviewsYet")}
          />
        </div>
      ) : null}

      {detail.trailerKey ? (
        <Sheet
          open={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          title={`${detail.name} — ${t("watchTrailer")}`}
        >
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
            {trailerOpen ? (
              <iframe
                title={`${detail.name} trailer`}
                src={`https://www.youtube-nocookie.com/embed/${detail.trailerKey}?autoplay=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full border-0"
              />
            ) : null}
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${detail.trailerKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-none mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-white/10 bg-ink-850 py-2.5 text-[0.8125rem] font-semibold text-mist-200 transition-colors hover:bg-ink-800 hover:text-white"
          >
            <span>{t("openOnYoutube")}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5">
              <path d="M7 17L17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </Sheet>
      ) : null}

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
          tmdbStatus={detail.tmdbStatus}
          hasUnairedSeason={hasUnaired}
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
