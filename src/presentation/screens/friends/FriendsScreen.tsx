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
            className="tap-none flex size-9 items-center justify-center rounded-full bg-ink-850 text-accent-500 transition-opacity active:opacity-70 hover:bg-ink-800"
            aria-label={t("findPeople")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[19px]">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        }
      />

      {data && data.length > 0 ? (
        <div className="ios-material no-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-white/[0.08] px-5 pt-2 pb-3">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`tap-none min-h-[34px] shrink-0 rounded-full px-4 text-[0.8125rem] font-semibold transition-colors ${
                filter === tab.id
                  ? "bg-white text-black"
                  : "border border-white/[0.07] bg-ink-850 text-mist-300 hover:bg-ink-800 hover:text-white"
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
          <p className="text-[1.0625rem] font-semibold text-white">{t("noActivity")}</p>
          <p className="mx-auto mt-1 max-w-xs text-[0.875rem] text-mist-500">
            Follow people to see the series they start, finish and rate.
          </p>
          <Link
            to="/search?tab=users"
            className="tap-none mt-5 inline-flex min-h-[44px] items-center rounded-[12px] bg-accent-500 px-5 text-[1.0625rem] font-semibold text-white active:opacity-80"
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
        <div className="mx-5 mt-3 overflow-hidden rounded-[14px] border border-white/[0.07] bg-ink-850 px-4">
          <ul className="divide-y divide-white/[0.08]">
            {filteredEvents.map((event) => (
              <ActivityRow
                key={`${event.actorId}-${event.eventType}-${event.seriesId}-${event.occurredAt}`}
                event={event}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {data && data.length > 0 ? (
        <p className="px-5 py-8 text-center text-[0.75rem] text-mist-500">
          Recent activity from {plural(actorCount, "person", "people")} you follow.
        </p>
      ) : null}
    </>
  );
}
