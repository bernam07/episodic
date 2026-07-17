const IMAGE_BASE = "https://image.tmdb.org/t/p";

export type PosterSize = "w154" | "w342" | "w500";
export type BackdropSize = "w780" | "w1280";
export type StillSize = "w300";
export type ProfileSize = "w185";

export function posterUrl(path: string | null, size: PosterSize = "w342"): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function backdropUrl(path: string | null, size: BackdropSize = "w780"): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function stillUrl(path: string | null, size: StillSize = "w300"): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function profileUrl(path: string | null, size: ProfileSize = "w185"): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}
