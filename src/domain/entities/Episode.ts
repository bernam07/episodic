export type Episode = {
  tmdbEpisodeId: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview: string | null;
  stillPath: string | null;
  airDate: string | null;
  runtime: number | null;
  voteAverage: number | null;
};

export type Season = {
  seasonNumber: number;
  name: string;
  overview: string | null;
  posterPath: string | null;
  airDate: string | null;
  episodes: Episode[];
};

export function hasAired(episode: Pick<Episode, "airDate">, now: Date = new Date()): boolean {
  if (!episode.airDate) {
    return false;
  }
  return new Date(episode.airDate).getTime() <= now.getTime();
}
