import { Link } from "react-router-dom";
import { posterUrl } from "@/data/tmdb/images";
import { activityVerb, type ActivityEvent } from "@/domain/entities/Activity";
import { Avatar } from "@/presentation/components/social/Avatar";
import { relativeTime } from "@/presentation/utils/relativeTime";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const EVENT_BADGES: Record<ActivityEvent["eventType"], { label: string; tone: string }> = {
  started: { label: "STARTED", tone: "bg-accent-500/15 text-accent-400 border-accent-500/30" },
  finished: { label: "COMPLETED", tone: "bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30" },
  reviewed: { label: "REVIEW", tone: "bg-[#f5c518]/15 text-[#f5c518] border-[#f5c518]/30" },
  progress: { label: "WATCHED", tone: "bg-white/10 text-mist-200 border-white/15" },
};

export function ActivityRow({
  event,
  showActor = true,
}: {
  event: ActivityEvent;
  showActor?: boolean;
}) {
  const poster = posterUrl(event.posterPath, "w154");
  const verb = activityVerb(event);
  const badge = EVENT_BADGES[event.eventType];

  return (
    <li className="rounded-[18px] border border-white/[0.08] bg-ink-850 p-4 transition-colors hover:border-white/[0.12]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {showActor ? (
            <Link to={`/user/${event.username}`} className="tap-none shrink-0">
              <Avatar
                username={event.username}
                displayName={event.displayName}
                avatarUrl={event.avatarUrl}
                size="sm"
                ring
              />
            </Link>
          ) : null}
          <div className="min-w-0">
            {showActor ? (
              <Link
                to={`/user/${event.username}`}
                className="block truncate text-[0.875rem] font-bold text-white hover:underline"
              >
                {event.displayName || event.username}
              </Link>
            ) : null}
            <p className="truncate text-[0.75rem] text-mist-400">
              {capitalize(verb)}{" "}
              <Link to={`/series/${event.tmdbId}`} className="font-semibold text-white hover:text-accent-400">
                {event.seriesName}
              </Link>
            </p>
          </div>
        </div>
        <span className="shrink-0 text-[0.75rem] font-medium text-mist-500">
          {relativeTime(event.occurredAt)}
        </span>
      </div>

      <Link
        to={`/series/${event.tmdbId}`}
        className="tap-none mt-3.5 flex gap-3.5 rounded-[14px] border border-white/[0.06] bg-ink-900/80 p-3 transition-colors hover:bg-ink-900 active:opacity-85"
      >
        <div className="h-[96px] w-[64px] shrink-0 overflow-hidden rounded-[9px] bg-ink-800 ring-1 ring-white/10 ring-inset">
          {poster ? (
            <img
              src={poster}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-bold tracking-[-0.015em] text-white">
            {event.seriesName}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-[5px] border px-1.5 py-0.5 text-[0.625rem] font-extrabold tracking-[0.04em] ${badge.tone}`}
            >
              {badge.label}
            </span>

            {event.rating ? (
              <span className="inline-flex items-center gap-1 text-[0.75rem] font-bold tabular-nums text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-3 text-star-500">
                  <path d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z" />
                </svg>
                {event.rating.toFixed(1)}
              </span>
            ) : null}

            {event.episodeCount && event.episodeCount > 0 ? (
              <span className="text-[0.75rem] font-medium text-mist-400">
                • {event.episodeCount} {event.episodeCount === 1 ? "episode" : "episodes"}
              </span>
            ) : null}
          </div>

          {event.eventType === "reviewed" && event.reviewBody ? (
            <p className="mt-2 line-clamp-2 text-[0.8125rem] leading-relaxed text-mist-300">
              {event.reviewBody}
            </p>
          ) : (
            <p className="mt-2 line-clamp-2 text-[0.75rem] text-mist-500">
              Tap to view series details, episodes, and ratings.
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
