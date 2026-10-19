import { useState } from "react";
import { Link } from "react-router-dom";
import { profileUrl } from "@/data/tmdb/images";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { usePersonDetail } from "@/presentation/hooks/useDiscovery";

type ActorDetailSheetProps = {
  open: boolean;
  onClose: () => void;
  personId: number | null;
  personName: string;
};

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;

  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function ActorDetailContent({
  personId,
  onClose,
}: {
  personId: number | null;
  onClose: () => void;
}) {
  const { data: person, isLoading } = usePersonDetail(personId);
  const [bioExpanded, setBioExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!person) {
    return <p className="py-8 text-center text-[0.875rem] text-mist-500">Could not load details.</p>;
  }

  const bio = person.biography?.trim() ?? "";
  const isLongBio = bio.length > 260;

  return (
    <div className="pt-4">
      <div className="flex items-center gap-4">
        {person.profilePath ? (
          <img
            src={profileUrl(person.profilePath) ?? undefined}
            alt=""
            className="size-20 shrink-0 rounded-full object-cover ring-1 ring-white/15 ring-inset"
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-ink-800 text-[1.75rem] font-bold text-mist-500 ring-1 ring-white/10 ring-inset">
            {person.name[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-[1.1875rem] font-extrabold tracking-[-0.02em] text-white">{person.name}</h3>
          {person.birthday ? (
            <p className="mt-1 text-[0.8125rem] font-medium text-mist-300">{formatDate(person.birthday)}</p>
          ) : null}
          {person.placeOfBirth ? (
            <p className="mt-0.5 text-[0.75rem] text-mist-500">{person.placeOfBirth}</p>
          ) : null}
        </div>
      </div>

      {bio ? (
        <div className="mt-4 rounded-[14px] border border-white/[0.07] bg-ink-850 p-3.5">
          <p
            className={`text-[0.8125rem] leading-relaxed whitespace-pre-line text-mist-200 ${
              isLongBio && !bioExpanded ? "line-clamp-5" : ""
            }`}
          >
            {bio}
          </p>
          {isLongBio ? (
            <button
              type="button"
              onClick={() => setBioExpanded((current) => !current)}
              className="tap-none mt-2.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-800 px-3 py-1 text-[0.75rem] font-semibold text-white transition-colors hover:bg-ink-700 active:opacity-75"
            >
              <span>{bioExpanded ? "Show less" : "Read full biography"}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                className={`size-3 transition-transform ${bioExpanded ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
        </div>
      ) : null}

      {person.knownFor.length > 0 ? (
        <section className="mt-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h4 className="text-[0.9375rem] font-bold tracking-[-0.015em] text-white">Known For</h4>
            <span className="text-[0.75rem] font-medium text-mist-500">{person.knownFor.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4">
            {person.knownFor.map((credit) => (
              <Link
                key={credit.tmdbId}
                to={`/series/${credit.tmdbId}`}
                onClick={onClose}
                className="tap-none block active:opacity-75"
              >
                <SeriesPoster path={credit.posterPath} alt={credit.name} />
                <p className="mt-2 truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-white">
                  {credit.name}
                </p>
                {credit.character ? (
                  <p className="mt-0.5 truncate text-[0.75rem] text-mist-400">{credit.character}</p>
                ) : null}
                {credit.episodeCount > 0 ? (
                  <p className="text-[0.6875rem] text-mist-500">
                    {credit.episodeCount} {credit.episodeCount === 1 ? "episode" : "episodes"}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function ActorDetailSheet({ open, onClose, personId, personName }: ActorDetailSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={personName}>
      {open ? <ActorDetailContent key={personId ?? "empty"} personId={personId} onClose={onClose} /> : null}
    </Sheet>
  );
}
