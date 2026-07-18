import { hasAired, type Episode } from "@/domain/entities/Episode";
import type {
  ContinueWatchingItem,
  SeasonProgress,
  SeriesProgress,
  UpNextItem,
  WatchedEpisodeRef,
} from "@/domain/entities/Progress";
import type { SeriesDetail } from "@/domain/entities/Series";
import type { SeriesStatus } from "@/domain/entities/SeriesStatus";
import type { ISeriesRepository } from "@/domain/repositories/ISeriesRepository";
import type { ITmdbRepository } from "@/domain/repositories/ITmdbRepository";
import type { ITrackingRepository } from "@/domain/repositories/ITrackingRepository";

export type CachedSeries = {
  seriesId: string;
  detail: SeriesDetail;
};

export class EnsureSeriesCached {
  constructor(
    private readonly tmdb: ITmdbRepository,
    private readonly series: ISeriesRepository
  ) {}

  async execute(tmdbId: number, detail?: SeriesDetail): Promise<CachedSeries> {
    const resolved = detail ?? (await this.tmdb.getSeriesDetail(tmdbId));
    const seriesId = await this.series.cacheSeries(resolved);
    return { seriesId, detail: resolved };
  }
}

export class CollectAiredEpisodes {
  constructor(private readonly tmdb: ITmdbRepository) {}

  async execute(tmdbId: number, detail: SeriesDetail): Promise<WatchedEpisodeRef[]> {
    const seasons = await Promise.all(
      detail.seasonsMeta.map((season) => this.tmdb.getSeason(tmdbId, season.seasonNumber))
    );

    return seasons.flatMap((season) =>
      season.episodes.filter((episode) => hasAired(episode)).map((episode) => ({
        tmdbEpisodeId: episode.tmdbEpisodeId,
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
      }))
    );
  }
}

export class SetSeriesStatus {
  constructor(
    private readonly tracking: ITrackingRepository,
    private readonly ensureCached: EnsureSeriesCached,
    private readonly collectAired: CollectAiredEpisodes
  ) {}

  async execute(tmdbId: number, status: SeriesStatus, detail?: SeriesDetail): Promise<string> {
    const { seriesId, detail: resolved } = await this.ensureCached.execute(tmdbId, detail);

    if (status === "watched") {
      const episodes = await this.collectAired.execute(tmdbId, resolved);
      await this.tracking.setSeriesWatched(seriesId, episodes);
    }

    if (status === "want_to_watch") {
      await this.tracking.clearSeriesEpisodes(seriesId);
    }

    await this.tracking.setStatus(seriesId, status);
    return seriesId;
  }
}

export class RemoveFromLibrary {
  constructor(private readonly tracking: ITrackingRepository) {}

  async execute(seriesId: string): Promise<void> {
    return this.tracking.removeFromLibrary(seriesId);
  }
}

export class GetLibrary {
  constructor(private readonly tracking: ITrackingRepository) {}

  async execute(status?: SeriesStatus): Promise<SeriesProgress[]> {
    return this.tracking.getLibrary(status);
  }
}

export class GetSeasonProgress {
  constructor(private readonly tracking: ITrackingRepository) {}

  async execute(seriesId: string): Promise<SeasonProgress[]> {
    return this.tracking.getSeasonProgress(seriesId);
  }
}

export class GetWatchedEpisodes {
  constructor(private readonly tracking: ITrackingRepository) {}

  async execute(seriesId: string): Promise<Set<number>> {
    const ids = await this.tracking.getWatchedEpisodes(seriesId);
    return new Set(ids);
  }
}

export class ToggleEpisodeWatched {
  constructor(private readonly tracking: ITrackingRepository) {}

  async execute(seriesId: string, episode: Episode, watched: boolean): Promise<void> {
    if (watched) {
      await this.tracking.markEpisode(seriesId, {
        tmdbEpisodeId: episode.tmdbEpisodeId,
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
      });
      return;
    }

    await this.tracking.unmarkEpisode(episode.tmdbEpisodeId);
  }
}

export class ToggleSeasonWatched {
  constructor(private readonly tracking: ITrackingRepository) {}

  async execute(
    seriesId: string,
    seasonNumber: number,
    episodes: Episode[],
    watched: boolean
  ): Promise<number> {
    return this.tracking.setSeasonWatched(
      seriesId,
      seasonNumber,
      episodes.map((episode) => ({
        tmdbEpisodeId: episode.tmdbEpisodeId,
        episodeNumber: episode.episodeNumber,
      })),
      watched
    );
  }
}

export class GetContinueWatching {
  constructor(private readonly tracking: ITrackingRepository) {}

  async execute(limit = 10): Promise<ContinueWatchingItem[]> {
    return this.tracking.getContinueWatching(limit);
  }
}

export class GetUpNext {
  constructor(private readonly tracking: ITrackingRepository) {}

  async execute(limit = 20): Promise<UpNextItem[]> {
    return this.tracking.getUpNext(limit);
  }
}

export class ToggleFavorite {
  constructor(private readonly tracking: ITrackingRepository) {}

  async execute(seriesId: string): Promise<void> {
    return this.tracking.toggleFavorite(seriesId);
  }
}
