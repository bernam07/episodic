import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ActivityRow } from "@/presentation/components/social/ActivityRow";
import { Avatar } from "@/presentation/components/social/Avatar";
import { FeedSkeleton } from "@/presentation/components/ui/Skeleton";
import { useFriendsFeed } from "@/presentation/hooks/useActivity";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import { ScreenHeader } from "@/presentation/layout/ScreenHeader";
import { plural } from "@/presentation/utils/plural";

type FeedFilter = "all" | "reviewed" | "milestones" | "progress";

export function FriendsScreen() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const { data, isLoading } = useFriendsFeed();

  const actors = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const list: { actorId: string; username: string; displayName: string | null; avatarUrl: string | null }[] = [];
    for (const event of data) {
      if (!seen.has(event.actorId)) {
        seen.add(event.actorId);
        list.push({
          actorId: event.actorId,
          username: event.username,
          displayName: event.displayName,
          avatarUrl: event.avatarUrl,
        });
      }
    }
    return list;
  }, [data]);

  const actorCount = actors.length;

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data;
    if (filter === "reviewed") return data.filter((e) => e.eventType === "reviewed");
    if (filter === "milestones") return data.filter((e) => e.eventType === "started" || e.eventType === "finished");
    if (filter === "progress") return data.filter((e) => e.eventType === "progress");
    return data;
  }, [data, filter]);

  const filterTabs: { id: FeedFilter; label: string }[] = [
    { id: "all", label: t("feedAll") },
    { id: "reviewed", label: t("feedReviews") },
    { id: "milestones", label: t("feedMilestones") },
    { id: "progress", label: t("episodes") },
  ];

  return (
    <>
      <ScreenHeader
        title={t("friends")}
        subtitle={data && data.length > 0 ? "What the people you follow are watching" : undefined}
        action={
          <Link
            to="/search?tab=users"
            className="tap-none flex size-9 items-center justify-center rounded-full border border-white/[0.08] bg-ink-850 text-white transition-opacity active:opacity-70 hover:bg-ink-800"
            aria-label={t("findPeople")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        }
      />

      {data && data.length > 0 ? (
        <>
          <div className="ios-material no-scrollbar sticky top-0 z-20 flex gap-6 overflow-x-auto border-b border-white/[0.08] px-5">
            {filterTabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`tap-none relative shrink-0 py-3 text-[0.875rem] font-semibold transition-colors ${
                    active ? "text-white" : "text-mist-500 hover:text-mist-300"
                  }`}
                >
                  {tab.label}
                  {active ? (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-white" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="no-scrollbar flex items-start gap-4 overflow-x-auto px-5 pt-4 pb-1">
            <Link
              to="/search?tab=users"
              className="tap-none flex w-14 shrink-0 flex-col items-center gap-1.5 active:opacity-75"
            >
              <span className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-ink-850 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </span>
              <span className="w-full truncate text-center text-[0.6875rem] font-medium text-mist-400">
                Add
              </span>
            </Link>

            {actors.map((actor) => (
              <Link
                key={actor.actorId}
                to={`/user/${actor.username}`}
                className="tap-none flex w-14 shrink-0 flex-col items-center gap-1.5 active:opacity-75"
              >
                <Avatar
                  username={actor.username}
                  displayName={actor.displayName}
                  avatarUrl={actor.avatarUrl}
                  size="md"
                  ring
                />
                <span className="w-full truncate text-center text-[0.6875rem] font-medium text-mist-200">
                  {actor.displayName || actor.username}
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {isLoading ? <FeedSkeleton count={6} /> : null}

      {!isLoading && (!data || data.length === 0) ? (
        <div className="px-5 pt-10 text-center">
          <p className="text-[1.0625rem] font-semibold text-white">{t("noActivity")}</p>
          <p className="mx-auto mt-1 max-w-xs text-[0.875rem] text-mist-500">
            Follow people to see the series they start, finish and rate.
          </p>
          <Link
            to="/search?tab=users"
            className="tap-none mt-5 inline-flex min-h-[46px] items-center rounded-[12px] bg-accent-500 px-5 text-[0.9375rem] font-semibold text-white shadow-[0_4px_14px_rgba(239,51,64,0.28)] active:opacity-85"
          >
            {t("findPeople")}
          </Link>
        </div>
      ) : null}

      {data && data.length > 0 && filteredEvents.length === 0 ? (
        <p className="px-5 pt-8 text-center text-[0.9375rem] text-mist-500">
          No activity in this filter yet.
        </p>
      ) : null}

      {filteredEvents.length > 0 ? (
        <ul className="mt-4 space-y-3.5 px-5">
          {filteredEvents.map((event) => (
            <ActivityRow
              key={`${event.actorId}-${event.eventType}-${event.seriesId}-${event.occurredAt}`}
              event={event}
            />
          ))}
        </ul>
      ) : null}

      {data && data.length > 0 ? (
        <p className="px-5 py-8 text-center text-[0.75rem] text-mist-500">
          Recent activity from {plural(actorCount, "person", "people")} you follow.
        </p>
      ) : null}
    </>
  );
}
