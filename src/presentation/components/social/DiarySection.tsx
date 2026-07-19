import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { posterUrl } from "@/data/tmdb/images";
import { activityVerb, type ActivityEvent, type ActivityEventType } from "@/domain/entities/Activity";
import { RatingDisplay } from "@/presentation/components/ui/Rating";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useUserDiary } from "@/presentation/hooks/useActivity";
import { relativeTime } from "@/presentation/utils/relativeTime";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const ICONS: Record<ActivityEventType, ReactNode> = {
  started: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  finished: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3">
      <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3">
      <path d="M5 4h14M5 12h14M5 20h9" strokeLinecap="round" />
    </svg>
  ),
  rated: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
};

const NODE_STYLES: Record<ActivityEventType, string> = {
  started: "bg-accent-500/15 text-accent-400",
  finished: "bg-emerald-500/15 text-emerald-400",
  progress: "bg-mist-500/15 text-mist-300",
  rated: "bg-amber-500/15 text-amber-400",
};

function EventCard({ event, last }: { event: ActivityEvent; last: boolean }) {
  const poster = posterUrl(event.posterPath, "w154");

  return (
    <li className="relative pl-9">
      {!last ? <span className="absolute top-7 bottom-0 left-[13px] w-px bg-ink-800" /> : null}
      <span
        className={`absolute top-1 left-0 flex size-7 items-center justify-center rounded-full ring-4 ring-ink-950 ${NODE_STYLES[event.eventType]}`}
      >
        {ICONS[event.eventType]}
      </span>

      <div className="mb-3 flex gap-3 rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5 ring-inset">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-snug text-mist-300">
            {capitalize(activityVerb(event))}{" "}
            <Link to={`/series/${event.tmdbId}`} className="font-semibold text-mist-100">
              {event.seriesName}
            </Link>
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[11px] text-mist-500">{relativeTime(event.occurredAt)}</span>
            {event.eventType === "rated" && event.rating !== null ? (
              <RatingDisplay value={event.rating} />
            ) : null}
          </div>
          {event.eventType === "rated" && event.reviewBody ? (
            <p className="mt-1.5 line-clamp-2 text-[12px] text-mist-400">{event.reviewBody}</p>
          ) : null}
        </div>

        <Link to={`/series/${event.tmdbId}`} className="tap-none shrink-0 active:opacity-70">
          <div className="h-[68px] w-[46px] overflow-hidden rounded-lg bg-ink-800">
            {poster ? <img src={poster} alt="" loading="lazy" className="size-full object-cover" /> : null}
          </div>
        </Link>
      </div>
    </li>
  );
}

export function DiarySection({ userId }: { userId: string | null }) {
  const { data, isLoading } = useUserDiary(userId);

  if (isLoading) {
    return (
      <section className="mt-8 px-5">
        <div className="flex h-20 items-center justify-center">
          <Spinner />
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  const events = data.slice(0, 12);

  return (
    <section className="mt-8 px-5">
      <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        Recent Activity
      </h2>
      <ul>
        {events.map((event, index) => (
          <EventCard
            key={`${event.eventType}-${event.seriesId}-${event.occurredAt}`}
            event={event}
            last={index === events.length - 1}
          />
        ))}
      </ul>
    </section>
  );
}
