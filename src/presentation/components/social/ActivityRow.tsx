import { Link } from "react-router-dom";
import { posterUrl } from "@/data/tmdb/images";
import { activityVerb, type ActivityEvent } from "@/domain/entities/Activity";
import { Avatar } from "@/presentation/components/social/Avatar";
import { relativeTime } from "@/presentation/utils/relativeTime";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ActivityRow({
  event,
  showActor = true,
}: {
  event: ActivityEvent;
  showActor?: boolean;
}) {
  const poster = posterUrl(event.posterPath, "w154");
  const verb = activityVerb(event);
  const seriesLink = (
    <Link to={`/series/${event.tmdbId}`} className="font-semibold text-accent-400">
      {event.seriesName}
    </Link>
  );

  return (
    <li className="flex gap-3 py-4">
      {showActor ? (
        <Link to={`/user/${event.username}`} className="tap-none shrink-0">
          <Avatar username={event.username} displayName={event.displayName} avatarUrl={event.avatarUrl} />
        </Link>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-mist-300">
          {showActor ? (
            <>
              <Link to={`/user/${event.username}`} className="font-semibold text-mist-100">
                {event.displayName || event.username}
              </Link>{" "}
              {verb} {seriesLink}
            </>
          ) : (
            <>
              {capitalize(verb)} {seriesLink}
            </>
          )}
        </p>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[11px] text-mist-500">{relativeTime(event.occurredAt)}</span>
        </div>

        {event.eventType === "reviewed" && event.reviewBody ? (
          <p className="mt-1.5 line-clamp-2 text-[13px] text-mist-400">{event.reviewBody}</p>
        ) : null}
      </div>

      <Link to={`/series/${event.tmdbId}`} className="tap-none shrink-0 active:opacity-70">
        <div className="h-[72px] w-12 overflow-hidden rounded-lg bg-ink-800">
          {poster ? <img src={poster} alt="" loading="lazy" className="size-full object-cover" /> : null}
        </div>
      </Link>
    </li>
  );
}
