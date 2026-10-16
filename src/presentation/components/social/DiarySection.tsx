import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { posterUrl } from "@/data/tmdb/images";
import { activityVerb, type ActivityEvent, type ActivityEventType } from "@/domain/entities/Activity";
import { FeedSkeleton } from "@/presentation/components/ui/Skeleton";
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
  reviewed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const NODE_STYLES: Record<ActivityEventType, string> = {
  started: "bg-accent-500/15 text-accent-400",
  finished: "bg-[#30d158]/15 text-[#30d158]",
  progress: "bg-mist-500/15 text-mist-300",
  reviewed: "bg-[#bf5af2]/15 text-[#bf5af2]",
};

function EventCard({ event, last }: { event: ActivityEvent; last: boolean }) {
  const poster = posterUrl(event.posterPath, "w154");

  return (
    <li className="relative pl-9">
      {!last ? <span className="absolute top-7 bottom-0 left-[13px] w-px bg-white/[0.08]" /> : null}
      <span
        className={`absolute top-1 left-0 flex size-7 items-center justify-center rounded-full ring-4 ring-ink-950 ${NODE_STYLES[event.eventType]}`}
      >
        {ICONS[event.eventType]}
      </span>

      <div className="mb-3 flex gap-3 rounded-[14px] border border-white/[0.07] bg-ink-850 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.875rem] leading-snug text-mist-300">
            {capitalize(activityVerb(event))}{" "}
            <Link to={`/series/${event.tmdbId}`} className="font-semibold text-white">
              {event.seriesName}
            </Link>
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[0.75rem] text-mist-500">{relativeTime(event.occurredAt)}</span>
          </div>
          {event.eventType === "reviewed" && event.reviewBody ? (
            <p className="mt-1.5 line-clamp-2 text-[0.8125rem] text-mist-400">{event.reviewBody}</p>
          ) : null}
        </div>

        <Link to={`/series/${event.tmdbId}`} className="tap-none shrink-0 active:opacity-75">
          <div className="h-[68px] w-[46px] overflow-hidden rounded-[8px] bg-ink-800 ring-1 ring-white/10 ring-inset">
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
      <section className="mt-8">
        <FeedSkeleton count={3} />
      </section>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  const events = data.slice(0, 12);

  return (
    <section className="mt-8 px-5">
      <h2 className="mb-4 text-[1.1875rem] font-bold tracking-[-0.015em] text-white">
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
