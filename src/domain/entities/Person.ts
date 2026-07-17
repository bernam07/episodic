export type PersonCredit = {
  tmdbId: number;
  name: string;
  character: string;
  posterPath: string | null;
  firstAirDate: string | null;
  voteAverage: number | null;
  episodeCount: number;
};

export type PersonDetail = {
  id: number;
  name: string;
  biography: string | null;
  profilePath: string | null;
  birthday: string | null;
  placeOfBirth: string | null;
  knownFor: PersonCredit[];
};
