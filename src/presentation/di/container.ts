import { SupabaseAuthRepository } from "@/data/supabase/SupabaseAuthRepository";
import { SupabaseReviewRepository } from "@/data/supabase/SupabaseReviewRepository";
import { SupabaseSeriesRepository } from "@/data/supabase/SupabaseSeriesRepository";
import { SupabaseTrackingRepository } from "@/data/supabase/SupabaseTrackingRepository";
import { TmdbRepository } from "@/data/tmdb/TmdbRepository";
import { SignIn, SignOut, SignUp } from "@/domain/usecases/auth/AuthUseCases";
import {
  GetSeason,
  GetSeriesDetail,
  GetTrending,
  SearchSeries,
} from "@/domain/usecases/discovery/DiscoveryUseCases";
import {
  DeleteReview,
  GetOwnReview,
  GetOwnReviews,
  GetSeriesReviews,
  SubmitReview,
} from "@/domain/usecases/reviews/ReviewUseCases";
import {
  CollectAiredEpisodes,
  EnsureSeriesCached,
  GetContinueWatching,
  GetLibrary,
  GetSeasonProgress,
  GetWatchedEpisodes,
  RemoveFromLibrary,
  SetSeriesStatus,
  ToggleEpisodeWatched,
  ToggleSeasonWatched,
} from "@/domain/usecases/tracking/TrackingUseCases";

const authRepository = new SupabaseAuthRepository();
const tmdbRepository = new TmdbRepository();
const seriesRepository = new SupabaseSeriesRepository();
const trackingRepository = new SupabaseTrackingRepository();
const reviewRepository = new SupabaseReviewRepository();

const ensureSeriesCached = new EnsureSeriesCached(tmdbRepository, seriesRepository);
const collectAiredEpisodes = new CollectAiredEpisodes(tmdbRepository);

export const container = {
  repositories: {
    auth: authRepository,
    tmdb: tmdbRepository,
    series: seriesRepository,
    tracking: trackingRepository,
    reviews: reviewRepository,
  },
  usecases: {
    signIn: new SignIn(authRepository),
    signUp: new SignUp(authRepository),
    signOut: new SignOut(authRepository),

    searchSeries: new SearchSeries(tmdbRepository),
    getTrending: new GetTrending(tmdbRepository),
    getSeriesDetail: new GetSeriesDetail(tmdbRepository),
    getSeason: new GetSeason(tmdbRepository),

    ensureSeriesCached,
    collectAiredEpisodes,
    setSeriesStatus: new SetSeriesStatus(trackingRepository, ensureSeriesCached, collectAiredEpisodes),
    removeFromLibrary: new RemoveFromLibrary(trackingRepository),
    getLibrary: new GetLibrary(trackingRepository),
    getSeasonProgress: new GetSeasonProgress(trackingRepository),
    getWatchedEpisodes: new GetWatchedEpisodes(trackingRepository),
    toggleEpisodeWatched: new ToggleEpisodeWatched(trackingRepository),
    toggleSeasonWatched: new ToggleSeasonWatched(trackingRepository),
    getContinueWatching: new GetContinueWatching(trackingRepository),

    submitReview: new SubmitReview(reviewRepository),
    getSeriesReviews: new GetSeriesReviews(reviewRepository),
    getOwnReview: new GetOwnReview(reviewRepository),
    getOwnReviews: new GetOwnReviews(reviewRepository),
    deleteReview: new DeleteReview(reviewRepository),
  },
} as const;
