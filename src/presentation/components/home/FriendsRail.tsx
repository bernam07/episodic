import { Link } from "react-router-dom";
import { ActivityRow } from "@/presentation/components/social/ActivityRow";
import { useFriendsFeed } from "@/presentation/hooks/useActivity";
import { useI18n } from "@/presentation/i18n/I18nProvider";

export function FriendsRail() {
  const { t } = useI18n();
  const { data } = useFriendsFeed();

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="mt-7">
      <div className="mb-2.5 flex items-baseline justify-between px-5">
        <h2 className="text-[1.1875rem] font-bold tracking-[-0.015em] text-white">{t("fromFriends")}</h2>
        <Link to="/friends" className="tap-none text-[0.9375rem] font-normal text-accent-500 active:opacity-70">
          {t("seeAll")}
        </Link>
      </div>
      <div className="mx-5 overflow-hidden rounded-[14px] border border-white/[0.07] bg-ink-850 px-4">
        <ul className="divide-y divide-white/[0.08]">
          {data.slice(0, 4).map((event) => (
            <ActivityRow key={`${event.actorId}-${event.eventType}-${event.seriesId}-${event.occurredAt}`} event={event} />
          ))}
        </ul>
      </div>
    </section>
  );
}
