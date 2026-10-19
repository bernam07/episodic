import { SupabaseActivityRepository } from "@/data/supabase/SupabaseActivityRepository";
import { SupabaseAuthRepository } from "@/data/supabase/SupabaseAuthRepository";
import { SupabaseListRepository } from "@/data/supabase/SupabaseListRepository";
import { SupabasePushRepository } from "@/data/supabase/SupabasePushRepository";
import { SupabaseNotificationRepository } from "@/data/supabase/SupabaseNotificationRepository";
import { SupabaseReviewRepository } from "@/data/supabase/SupabaseReviewRepository";
import { SupabaseSeriesRepository } from "@/data/supabase/SupabaseSeriesRepository";
import { SupabaseSocialRepository } from "@/data/supabase/SupabaseSocialRepository";
import { SupabaseTrackingRepository } from "@/data/supabase/SupabaseTrackingRepository";
import { TmdbRepository } from "@/data/tmdb/TmdbRepository";
import {
  GetFriendsFeed as GetActivityFeed,
  GetUserDiary,
} from "@/domain/usecases/activity/ActivityUseCases";
import {
  AddToList,
  CreateList,
  DeleteList,
  GetList,
  GetListItems,
  GetUserLists,
  RemoveFromList,
  UpdateList,
} from "@/domain/usecases/lists/ListUseCases";
import {
  CheckUsernameAvailable,
  DeleteAccount,
  RequestPasswordReset,
  SignIn,
  SignOut,
  SignUp,
  UpdatePassword,
  UpdateProfile,
  UploadAvatar,
  UploadBanner,
} from "@/domain/usecases/auth/AuthUseCases";
import {
  DiscoverByGenre,
  GetCredits,
  GetGenres,
  GetPersonDetail,
  GetRecommendations,
  GetSeason,
  GetSeriesDetail,
  GetTrending,
  GetWatchProviders,
  SearchSeries,
} from "@/domain/usecases/discovery/DiscoveryUseCases";
import {
  GetNotifications,
  GetUnreadCount,
  MarkNotificationsRead,
} from "@/domain/usecases/notifications/NotificationUseCases";
import {
  DeleteReview,
  GetOwnReview,
  GetOwnReviews,
  GetRatingSummary,
  GetSeriesReviews,
  SubmitReview,
} from "@/domain/usecases/reviews/ReviewUseCases";
import {
  CompareLibraries,
  GetFollowers,
  GetFollowing,
  GetProfileSummary,
  GetUserFavorites,
  GetUserLibrary,
  SearchProfiles,
  ToggleFollow,
} from "@/domain/usecases/social/SocialUseCases";
import {
  CollectAiredEpisodes,
  EnsureSeriesCached,
  GetContinueWatching,
  GetUpNext,
  GetLibrary,
  GetSeasonProgress,
  GetWatchedEpisodes,
  RemoveFromLibrary,
  SetSeriesStatus,
  ToggleEpisodeWatched,
  SetRating,
  ToggleFavorite,
  ToggleSeasonWatched,
} from "@/domain/usecases/tracking/TrackingUseCases";

const authRepository = new SupabaseAuthRepository();
const tmdbRepository = new TmdbRepository();
const seriesRepository = new SupabaseSeriesRepository();
const trackingRepository = new SupabaseTrackingRepository();
const reviewRepository = new SupabaseReviewRepository();
const socialRepository = new SupabaseSocialRepository();
const notificationRepository = new SupabaseNotificationRepository();
const activityRepository = new SupabaseActivityRepository();
const listRepository = new SupabaseListRepository();
const pushRepository = new SupabasePushRepository();

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
    notifications: notificationRepository,
    activity: activityRepository,
    lists: listRepository,
    push: pushRepository,
  },
  usecases: {
    signIn: new SignIn(authRepository),
    signUp: new SignUp(authRepository, socialRepository),
    signOut: new SignOut(authRepository),
    requestPasswordReset: new RequestPasswordReset(authRepository),
    updatePassword: new UpdatePassword(authRepository),
    checkUsernameAvailable: new CheckUsernameAvailable(socialRepository),
    updateProfile: new UpdateProfile(authRepository),
    uploadAvatar: new UploadAvatar(authRepository),
    uploadBanner: new UploadBanner(authRepository),
    deleteAccount: new DeleteAccount(authRepository),

    searchSeries: new SearchSeries(tmdbRepository),
    getTrending: new GetTrending(tmdbRepository),
    getGenres: new GetGenres(tmdbRepository),
    discoverByGenre: new DiscoverByGenre(tmdbRepository),
    getRecommendations: new GetRecommendations(tmdbRepository),
    getSeriesDetail: new GetSeriesDetail(tmdbRepository),
    getSeason: new GetSeason(tmdbRepository),
    getCredits: new GetCredits(tmdbRepository),
    getPersonDetail: new GetPersonDetail(tmdbRepository),
    getWatchProviders: new GetWatchProviders(tmdbRepository),

    ensureSeriesCached,
    collectAiredEpisodes,
    setSeriesStatus: new SetSeriesStatus(trackingRepository, ensureSeriesCached, collectAiredEpisodes),
    removeFromLibrary: new RemoveFromLibrary(trackingRepository),
    getLibrary: new GetLibrary(trackingRepository),
    getSeasonProgress: new GetSeasonProgress(trackingRepository),
    getWatchedEpisodes: new GetWatchedEpisodes(trackingRepository),
    toggleEpisodeWatched: new ToggleEpisodeWatched(trackingRepository),
    toggleSeasonWatched: new ToggleSeasonWatched(trackingRepository),
    toggleFavorite: new ToggleFavorite(trackingRepository),
    setRating: new SetRating(trackingRepository),
    getContinueWatching: new GetContinueWatching(trackingRepository),
    getUpNext: new GetUpNext(trackingRepository),

    submitReview: new SubmitReview(reviewRepository),
    getSeriesReviews: new GetSeriesReviews(reviewRepository),
    getOwnReview: new GetOwnReview(reviewRepository),
    getOwnReviews: new GetOwnReviews(reviewRepository),
    deleteReview: new DeleteReview(reviewRepository),
    getRatingSummary: new GetRatingSummary(reviewRepository),

    searchProfiles: new SearchProfiles(socialRepository),
    getProfileSummary: new GetProfileSummary(socialRepository),
    getUserLibrary: new GetUserLibrary(socialRepository),
    getUserFavorites: new GetUserFavorites(socialRepository),
    getFollowers: new GetFollowers(socialRepository),
    getFollowing: new GetFollowing(socialRepository),
    toggleFollow: new ToggleFollow(socialRepository),
    compareLibraries: new CompareLibraries(socialRepository),

    getNotifications: new GetNotifications(notificationRepository),
    getUnreadCount: new GetUnreadCount(notificationRepository),
    markNotificationsRead: new MarkNotificationsRead(notificationRepository),

    getActivityFeed: new GetActivityFeed(activityRepository),
    getUserDiary: new GetUserDiary(activityRepository),

    getUserLists: new GetUserLists(listRepository),
    getList: new GetList(listRepository),
    getListItems: new GetListItems(listRepository),
    createList: new CreateList(listRepository),
    updateList: new UpdateList(listRepository),
    deleteList: new DeleteList(listRepository),
    addToList: new AddToList(listRepository, ensureSeriesCached),
    removeFromList: new RemoveFromList(listRepository),
  },
} as const;
