import { posterUrl, type PosterSize } from "@/data/tmdb/images";

type SeriesPosterProps = {
  path: string | null;
  alt: string;
  size?: PosterSize;
  className?: string;
};

export function SeriesPoster({ path, alt, size = "w342", className = "" }: SeriesPosterProps) {
  const url = posterUrl(path, size);

  return (
    <div className={`relative aspect-2/3 overflow-hidden rounded-2xl bg-ink-850 ring-1 ring-white/10 shadow-md shadow-black/40 ${className}`}>
      {url ? (
        <>
          <img
            src={url}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/10 opacity-60" />
        </>
      ) : (
        <div className="flex size-full items-center justify-center p-2">
          <span className="line-clamp-3 text-center text-[11px] font-medium text-mist-500">{alt}</span>
        </div>
      )}
    </div>
  );
}
