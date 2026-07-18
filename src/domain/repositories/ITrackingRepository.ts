import type {
  ContinueWatchingItem,
  SeasonProgress,
  SeriesProgress,
  UpNextItem,
  WatchedEpisodeRef,
} from "../entities/Progress";
import type { SeriesStatus, UserSeriesStatus } from "../entities/SeriesStatus";

export interface ITrackingRepository {
  getLibrary(status?: SeriesStatus): Promise<SeriesProgress[]>;
  getSeriesProgress(seriesId: string): Promise<SeriesProgress | null>;
  getStatus(seriesId: string): Promise<UserSeriesStatus | null>;
  setStatus(seriesId: string, status: SeriesStatus): Promise<void>;
  removeFromLibrary(seriesId: string): Promise<void>;
  getSeasonProgress(seriesId: string): Promise<SeasonProgress[]>;
  getWatchedEpisodes(seriesId: string): Promise<number[]>;
  markEpisode(seriesId: string, episode: WatchedEpisodeRef): Promise<void>;
  unmarkEpisode(tmdbEpisodeId: number): Promise<void>;
  setSeasonWatched(
    seriesId: string,
    seasonNumber: number,
    episodes: Pick<WatchedEpisodeRef, "tmdbEpisodeId" | "episodeNumber">[],
    watched: boolean
  ): Promise<number>;
  setSeriesWatched(seriesId: string, episodes: WatchedEpisodeRef[]): Promise<number>;
  clearSeriesEpisodes(seriesId: string): Promise<number>;
  getContinueWatching(limit?: number): Promise<ContinueWatchingItem[]>;
  getUpNext(limit?: number): Promise<UpNextItem[]>;
  toggleFavorite(seriesId: string): Promise<void>;
}
