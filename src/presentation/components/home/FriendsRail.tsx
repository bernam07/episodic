import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ActivityRow } from "@/presentation/components/social/ActivityRow";
import { Avatar } from "@/presentation/components/social/Avatar";
import { useFriendsFeed } from "@/presentation/hooks/useActivity";
import { useI18n } from "@/presentation/i18n/I18nProvider";

export function FriendsRail() {
  const { t } = useI18n();
  const { data } = useFriendsFeed();

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

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-baseline justify-between px-5">
        <h2 className="text-[1.125rem] font-bold tracking-[-0.015em] text-white">{t("fromFriends")}</h2>
        <Link to="/friends" className="tap-none text-[0.8125rem] font-semibold text-mist-400 hover:text-white active:opacity-70">
          {t("seeAll")}
        </Link>
      </div>

      <div className="no-scrollbar mb-4 flex items-start gap-4 overflow-x-auto px-5 py-1">
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

      <ul className="space-y-3.5 px-5">
        {data.slice(0, 4).map((event) => (
          <ActivityRow key={`${event.actorId}-${event.eventType}-${event.seriesId}-${event.occurredAt}`} event={event} />
        ))}
      </ul>
    </section>
  );
}
