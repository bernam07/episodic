import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ActivityRow } from "@/presentation/components/social/ActivityRow";
import { Avatar } from "@/presentation/components/social/Avatar";
import { FeedSkeleton } from "@/presentation/components/ui/Skeleton";
import { useFriendsFeed } from "@/presentation/hooks/useActivity";
import { useI18n } from "@/presentation/i18n/I18nProvider";

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
      <header className="ios-material sticky top-0 z-30 border-b border-white/[0.08] px-5 pt-[calc(env(safe-area-inset-top)+0.625rem)]">
        <div className="flex items-center justify-between gap-3 pb-2.5">
          <h1 className="text-[1.25rem] font-extrabold tracking-[-0.025em] text-white">
            {t("friends")}
          </h1>

          <Link
            to="/search?tab=users"
            className="tap-none flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-ink-850 px-3 py-1.5 text-[0.75rem] font-semibold text-white transition-colors hover:bg-ink-800 active:opacity-75"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5 text-accent-400">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("findPeople")}
          </Link>
        </div>

        {data && data.length > 0 ? (
          <div className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5">
            {filterTabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`tap-none relative shrink-0 px-3 py-2 text-[0.8125rem] font-semibold capitalize transition-colors ${
                    active ? "text-white" : "text-mist-400 hover:text-mist-200"
                  }`}
                >
                  {tab.label}
                  {active ? (
                    <span className="absolute right-2.5 bottom-0 left-2.5 h-[2px] rounded-full bg-accent-500" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      {data && data.length > 0 ? (
        <div className="no-scrollbar flex items-start gap-3.5 overflow-x-auto px-5 pt-4 pb-1">
          <Link
            to="/search?tab=users"
            className="tap-none flex w-14 shrink-0 flex-col items-center gap-1.5 active:opacity-75"
          >
            <span className="flex size-11 items-center justify-center rounded-full border border-dashed border-white/20 bg-ink-850 text-mist-300 transition-colors hover:border-accent-500 hover:text-accent-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </span>
            <span className="w-full truncate text-center text-[0.6875rem] font-medium text-mist-400">
              {t("addFriend")}
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
      ) : null}

      {isLoading ? <FeedSkeleton count={6} /> : null}

      {!isLoading && (!data || data.length === 0) ? (
        <div className="px-5 pt-10 text-center">
          <p className="text-[1.0625rem] font-semibold text-white">{t("noActivity")}</p>
          <p className="mx-auto mt-1 max-w-xs text-[0.875rem] text-mist-500">
            {t("noActivitySub")}
          </p>
          <Link
            to="/search?tab=users"
            className="tap-none mt-5 inline-flex min-h-[44px] items-center rounded-full bg-accent-500 px-5 text-[0.875rem] font-semibold text-white active:opacity-85"
          >
            {t("findPeople")}
          </Link>
        </div>
      ) : null}

      {data && data.length > 0 && filteredEvents.length === 0 ? (
        <p className="px-5 pt-8 text-center text-[0.9375rem] text-mist-500">
          {t("noMatchingActivitySub")}
        </p>
      ) : null}

      {filteredEvents.length > 0 ? (
        <ul className="mt-4 space-y-3 px-5">
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
          {t("caughtUpWithEveryone")}
        </p>
      ) : null}
    </>
  );
}
