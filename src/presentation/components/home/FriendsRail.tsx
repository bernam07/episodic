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
      <div className="mb-2 flex items-center justify-between px-5">
        <h2 className="text-[13px] font-semibold tracking-wide text-mist-400 uppercase">{t("fromFriends")}</h2>
        <Link to="/friends" className="tap-none text-[12px] font-semibold text-accent-400 active:text-accent-300">
          {t("seeAll")}
        </Link>
      </div>
      <ul className="divide-y divide-ink-800 px-5">
        {data.slice(0, 4).map((event) => (
          <ActivityRow key={`${event.actorId}-${event.eventType}-${event.seriesId}-${event.occurredAt}`} event={event} />
        ))}
      </ul>
    </section>
  );
}
