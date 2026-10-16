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
    <div className={`relative aspect-2/3 overflow-hidden rounded-[12px] bg-ink-850 ring-1 ring-white/10 ring-inset shadow-sm shadow-black/50 ${className}`}>
      {url ? (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex size-full items-center justify-center p-2">
          <span className="line-clamp-3 text-center text-[0.6875rem] font-medium text-mist-500">{alt}</span>
        </div>
      )}
    </div>
  );
}
