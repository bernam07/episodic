import { profileUrl } from "@/data/tmdb/images";
import type { CastMember } from "@/domain/entities/Cast";

type SeriesCastRailProps = {
  cast: CastMember[];
  onSelectActor: (actor: { id: number; name: string }) => void;
};

export function SeriesCastRail({ cast, onSelectActor }: SeriesCastRailProps) {
  if (cast.length === 0) {
    return null;
  }

  return (
    <section className="mt-7">
      <h2 className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">Cast</h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-5 pb-1">
        {cast.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelectActor({ id: member.id, name: member.name })}
            className="tap-none flex w-[68px] shrink-0 flex-col items-center gap-1.5 active:opacity-70"
          >
            <div className="size-[68px] overflow-hidden rounded-full bg-ink-800">
              {member.profilePath ? (
                <img
                  src={profileUrl(member.profilePath) ?? undefined}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[22px] text-mist-600">
                  {member.name[0]}
                </div>
              )}
            </div>
            <p className="w-full truncate text-center text-[11px] font-medium text-mist-200">
              {member.name}
            </p>
            <p className="w-full truncate text-center text-[10px] text-mist-500">
              {member.character}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
