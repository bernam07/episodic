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
    <li className="group flex gap-3.5 py-3.5">
      {showActor ? (
        <Link to={`/user/${event.username}`} className="tap-none shrink-0">
          <Avatar username={event.username} displayName={event.displayName} avatarUrl={event.avatarUrl} />
        </Link>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-[0.875rem] leading-snug text-mist-300">
          {showActor ? (
            <>
              <Link to={`/user/${event.username}`} className="font-semibold text-white hover:underline">
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
          <span className="text-[0.75rem] text-mist-500">{relativeTime(event.occurredAt)}</span>
          {event.rating ? (
            <span className="flex items-center gap-0.5 text-[0.75rem] font-semibold tabular-nums text-star-500">
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-2.5">
                <path d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z" />
              </svg>
              {event.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        {event.eventType === "reviewed" && event.reviewBody ? (
          <p className="mt-1.5 line-clamp-2 text-[0.8125rem] text-mist-400">{event.reviewBody}</p>
        ) : null}
      </div>

      <Link to={`/series/${event.tmdbId}`} className="tap-none shrink-0 active:opacity-75">
        <div className="h-[72px] w-12 overflow-hidden rounded-[8px] bg-ink-800 ring-1 ring-white/10 ring-inset">
          {poster ? (
            <img
              src={poster}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : null}
        </div>
      </Link>
    </li>
  );
}
