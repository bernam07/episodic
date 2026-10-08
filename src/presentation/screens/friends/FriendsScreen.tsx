import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ActivityRow } from "@/presentation/components/social/ActivityRow";
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
  const actorCount = data ? new Set(data.map((event) => event.actorId)).size : 0;

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
            className="tap-none flex size-10 items-center justify-center rounded-full bg-ink-800 text-mist-300 active:bg-ink-700"
            aria-label={t("findPeople")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4-4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        }
      />

      {data && data.length > 0 ? (
        <div className="no-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto bg-ink-950/80 px-5 pb-3 backdrop-blur-xl">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`tap-none min-h-[34px] shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${
                filter === tab.id
                  ? "bg-accent-600 text-white"
                  : "bg-ink-800 text-mist-400 active:bg-ink-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      {isLoading ? <FeedSkeleton count={6} /> : null}

      {!isLoading && (!data || data.length === 0) ? (
        <div className="px-5 pt-10 text-center">
          <p className="text-[15px] font-semibold text-mist-200">{t("noActivity")}</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-mist-500">
            Follow people to see the series they start, finish and rate.
          </p>
          <Link
            to="/search?tab=users"
            className="tap-none mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-accent-600 px-5 text-[14px] font-semibold text-white active:bg-accent-500"
          >
            {t("findPeople")}
          </Link>
        </div>
      ) : null}

      {data && data.length > 0 && filteredEvents.length === 0 ? (
        <p className="px-5 pt-8 text-center text-[14px] text-mist-500">
          No activity in this filter yet.
        </p>
      ) : null}

      {filteredEvents.length > 0 ? (
        <ul className="divide-y divide-ink-800 px-5">
          {filteredEvents.map((event) => (
            <ActivityRow
              key={`${event.actorId}-${event.eventType}-${event.seriesId}-${event.occurredAt}`}
              event={event}
            />
          ))}
        </ul>
      ) : null}

      {data && data.length > 0 ? (
        <p className="px-5 py-8 text-center text-[12px] text-mist-500">
          Recent activity from {plural(actorCount, "person", "people")} you follow.
        </p>
      ) : null}
    </>
  );
}
