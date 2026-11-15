import { Link } from "react-router-dom";
import { posterUrl } from "@/data/tmdb/images";
import { activityVerb, type ActivityEvent } from "@/domain/entities/Activity";
import { Avatar } from "@/presentation/components/social/Avatar";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import type { TranslationKey } from "@/presentation/i18n/translations";
import { relativeTime } from "@/presentation/utils/relativeTime";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const EVENT_BADGES: Record<ActivityEvent["eventType"], { key: TranslationKey; tone: string }> = {
  started: { key: "activityStarted", tone: "bg-accent-500/15 text-accent-400 border-accent-500/30" },
  finished: { key: "activityFinished", tone: "bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30" },
  reviewed: { key: "activityReviewed", tone: "bg-[#f5c518]/15 text-[#f5c518] border-[#f5c518]/30" },
  progress: { key: "activityProgress", tone: "bg-white/10 text-mist-200 border-white/15" },
};

export function ActivityRow({
  event,
  showActor = true,
}: {
  event: ActivityEvent;
  showActor?: boolean;
}) {
  const { t } = useI18n();
  const poster = posterUrl(event.posterPath, "w154");
  const verb = activityVerb(event);
  const badge = EVENT_BADGES[event.eventType];

  return (
    <li className="rounded-[16px] border border-white/[0.08] bg-ink-850/90 p-3.5 transition-colors hover:border-white/[0.14]">
      <div className="flex items-start gap-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            {showActor ? (
              <Link to={`/user/${event.username}`} className="tap-none flex min-w-0 items-center gap-2">
                <Avatar
                  username={event.username}
                  displayName={event.displayName}
                  avatarUrl={event.avatarUrl}
                  size="sm"
                />
                <span className="truncate text-[0.8125rem] font-bold text-white hover:underline">
                  {event.displayName || event.username}
                </span>
              </Link>
            ) : (
              <span
                className={`rounded-[6px] border px-1.5 py-0.5 text-[0.625rem] font-extrabold uppercase tracking-[0.04em] ${badge.tone}`}
              >
                {t(badge.key)}
              </span>
            )}
            <span className="shrink-0 text-[0.6875rem] font-medium text-mist-500">
              {relativeTime(event.occurredAt)}
            </span>
          </div>

          <Link
            to={`/series/${event.tmdbId}`}
            className="tap-none mt-2 block text-[0.9375rem] font-bold tracking-[-0.015em] text-white hover:text-accent-400"
          >
            {event.seriesName}
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            {showActor ? (
              <span
                className={`rounded-[5px] border px-1.5 py-0.5 text-[0.625rem] font-extrabold uppercase tracking-[0.04em] ${badge.tone}`}
              >
                {t(badge.key)}
              </span>
            ) : null}

            <span className="text-[0.75rem] text-mist-400">{capitalize(verb)}</span>

            {event.rating ? (
              <span className="inline-flex items-center gap-1 rounded-[5px] bg-star-500/12 px-1.5 py-0.5 text-[0.75rem] font-bold tabular-nums text-star-500">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
                  <path d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z" />
                </svg>
                {event.rating.toFixed(1)}
              </span>
            ) : null}
          </div>

          {event.eventType === "reviewed" && event.reviewBody ? (
            <p className="mt-2 line-clamp-2 rounded-[10px] border border-white/[0.06] bg-ink-900/70 px-3 py-2 text-[0.8125rem] leading-relaxed text-mist-200">
              {event.reviewBody}
            </p>
          ) : null}
        </div>

        <Link
          to={`/series/${event.tmdbId}`}
          className="tap-none h-[78px] w-[52px] shrink-0 overflow-hidden rounded-[9px] bg-ink-800 ring-1 ring-white/10 ring-inset active:opacity-80"
        >
          {poster ? (
            <img
              src={poster}
              alt={event.seriesName}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : null}
        </Link>
      </div>
    </li>
  );
}
