import { Link } from "react-router-dom";
import { posterUrl, profileUrl } from "@/data/tmdb/images";
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

export function ActorDetailSheet({ open, onClose, personId, personName }: ActorDetailSheetProps) {
  const { data: person, isLoading } = usePersonDetail(open ? personId : null);

  return (
    <Sheet open={open} onClose={onClose} title={personName}>
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : !person ? (
        <p className="py-8 text-center text-[14px] text-mist-500">Could not load details.</p>
      ) : (
        <div className="max-h-[70dvh] overflow-y-auto">
          <div className="flex items-start gap-4">
            {person.profilePath ? (
              <img
                src={profileUrl(person.profilePath) ?? undefined}
                alt=""
                className="size-20 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-ink-800 text-[28px] text-mist-600">
                {person.name[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-[18px] font-bold text-mist-100">{person.name}</h3>
              {person.birthday ? (
                <p className="mt-0.5 text-[12px] text-mist-400">{formatDate(person.birthday)}</p>
              ) : null}
              {person.placeOfBirth ? (
                <p className="text-[12px] text-mist-500">{person.placeOfBirth}</p>
              ) : null}
            </div>
          </div>

          {person.biography ? (
            <p className="mt-4 line-clamp-6 text-[13px] leading-relaxed text-mist-300">{person.biography}</p>
          ) : null}

          {person.knownFor.length > 0 ? (
            <section className="mt-5">
              <h4 className="mb-3 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
                Known For
                <span className="ml-1.5 text-mist-600">{person.knownFor.length}</span>
              </h4>
              <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4">
                {person.knownFor.map((credit) => (
                  <Link
                    key={credit.tmdbId}
                    to={`/series/${credit.tmdbId}`}
                    onClick={onClose}
                    className="tap-none active:opacity-70"
                  >
                    <SeriesPoster path={credit.posterPath} alt={credit.name} />
                    <p className="mt-1.5 truncate text-[12px] font-medium text-mist-200">{credit.name}</p>
                    {credit.character ? (
                      <p className="truncate text-[11px] text-mist-500">{credit.character}</p>
                    ) : null}
                    {credit.episodeCount > 0 ? (
                      <p className="text-[10px] text-mist-600">
                        {credit.episodeCount} {credit.episodeCount === 1 ? "episode" : "episodes"}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}
