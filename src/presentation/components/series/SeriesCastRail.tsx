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
      <div className="mb-3 flex items-baseline justify-between px-5">
        <h2 className="text-[1.125rem] font-bold tracking-[-0.015em] text-white">Top Cast & Crew</h2>
        <span className="text-[0.75rem] font-medium text-mist-500">{cast.length}</span>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
        {cast.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelectActor({ id: member.id, name: member.name })}
            className="tap-none flex w-[112px] shrink-0 flex-col items-center rounded-[14px] border border-white/[0.08] bg-ink-850 p-3 text-center transition-colors hover:bg-ink-800 active:opacity-75"
          >
            <div className="size-14 overflow-hidden rounded-full bg-ink-800 ring-1 ring-white/15 ring-inset">
              {member.profilePath ? (
                <img
                  src={profileUrl(member.profilePath) ?? undefined}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[1.125rem] font-bold text-mist-500">
                  {member.name[0]}
                </div>
              )}
            </div>
            <p className="mt-2.5 w-full truncate text-[0.75rem] font-bold text-white">
              {member.name}
            </p>
            <p className="mt-0.5 w-full truncate text-[0.6875rem] text-mist-500">
              {member.character}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
