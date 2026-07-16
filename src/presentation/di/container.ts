import { SupabaseAuthRepository } from "@/data/supabase/SupabaseAuthRepository";
import { SupabaseReviewRepository } from "@/data/supabase/SupabaseReviewRepository";
import { SupabaseSeriesRepository } from "@/data/supabase/SupabaseSeriesRepository";
import { SupabaseSocialRepository } from "@/data/supabase/SupabaseSocialRepository";
import { SupabaseTrackingRepository } from "@/data/supabase/SupabaseTrackingRepository";
import { TmdbRepository } from "@/data/tmdb/TmdbRepository";
import {
  CheckUsernameAvailable,
  RequestPasswordReset,
  SignIn,
  SignOut,
  SignUp,
  UpdatePassword,
} from "@/domain/usecases/auth/AuthUseCases";
import {
  DiscoverByGenre,
  GetGenres,
  GetRecommendations,
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
  GetFollowingFeed,
  GetProfileSummary,
  GetUserLibrary,
  SearchProfiles,
  ToggleFollow,
} from "@/domain/usecases/social/SocialUseCases";
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
const socialRepository = new SupabaseSocialRepository();

const ensureSeriesCached = new EnsureSeriesCached(tmdbRepository, seriesRepository);
const collectAiredEpisodes = new CollectAiredEpisodes(tmdbRepository);

export const container = {
  repositories: {
    auth: authRepository,
    tmdb: tmdbRepository,
    series: seriesRepository,
    tracking: trackingRepository,
    reviews: reviewRepository,
    social: socialRepository,
  },
  usecases: {
    signIn: new SignIn(authRepository),
    signUp: new SignUp(authRepository, socialRepository),
    signOut: new SignOut(authRepository),
    requestPasswordReset: new RequestPasswordReset(authRepository),
    updatePassword: new UpdatePassword(authRepository),
    checkUsernameAvailable: new CheckUsernameAvailable(socialRepository),

    searchSeries: new SearchSeries(tmdbRepository),
    getTrending: new GetTrending(tmdbRepository),
    getGenres: new GetGenres(tmdbRepository),
    discoverByGenre: new DiscoverByGenre(tmdbRepository),
    getRecommendations: new GetRecommendations(tmdbRepository),
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

    searchProfiles: new SearchProfiles(socialRepository),
    getProfileSummary: new GetProfileSummary(socialRepository),
    getFollowingFeed: new GetFollowingFeed(socialRepository),
    getUserLibrary: new GetUserLibrary(socialRepository),
    toggleFollow: new ToggleFollow(socialRepository),
  },
} as const;
