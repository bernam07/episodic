import { useState } from "react";
import { Link } from "react-router-dom";
import { NotificationSheet } from "@/presentation/components/notifications/NotificationSheet";
import { FriendsRail } from "@/presentation/components/home/FriendsRail";
import { HomeHero } from "@/presentation/components/home/HomeHero";
import { RecommendationsRail } from "@/presentation/components/home/RecommendationsRail";
import { ThisWeekRail } from "@/presentation/components/home/ThisWeekRail";
import { TrendingRail } from "@/presentation/components/home/TrendingRail";
import { UpNextRail } from "@/presentation/components/home/UpNextRail";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useTrending } from "@/presentation/hooks/useDiscovery";
import { useUnreadCount } from "@/presentation/hooks/useNotifications";
import { useI18n } from "@/presentation/i18n/I18nProvider";

function greeting(lang: "en" | "pt"): string {
  const hour = new Date().getHours();
  if (lang === "pt") {
    if (hour < 6) return "Boa madrugada";
    if (hour < 12) return "Bom dia";
    if (hour < 19) return "Boa tarde";
    return "Boa noite";
  }
  if (hour < 6) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeScreen() {
  const { language, t } = useI18n();
  const { profile } = useAuth();
  const { data: trending } = useTrending();
  const { data: unreadCount } = useUnreadCount();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const featured = trending?.results[0];
  const greet = greeting(language);

  return (
    <>
      <header className="ios-material sticky top-0 z-30 flex items-end justify-between border-b border-white/[0.08] px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <div>
          <p className="text-[0.8125rem] font-medium text-mist-500">
            {profile ? `${greet}, ${profile.displayName || profile.username}` : greet}
          </p>
          <h1 className="mt-0.5 text-[2.125rem] leading-[1.12] font-bold tracking-[-0.022em] text-white">
            Episodic
          </h1>
        </div>
        <div className="mb-0.5 flex gap-2">
          <Link
            to="/calendar"
            className="tap-none flex size-9 items-center justify-center rounded-full bg-ink-850 text-accent-500 transition-opacity active:opacity-70 hover:bg-ink-800"
            aria-label={t("calendar")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[19px]">
              <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="tap-none relative flex size-9 items-center justify-center rounded-full bg-ink-850 text-accent-500 transition-opacity active:opacity-70 hover:bg-ink-800"
            aria-label={t("notifications")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[19px]">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {(unreadCount ?? 0) > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-500 px-1 text-[0.6875rem] font-bold text-white ring-2 ring-ink-950">
                {unreadCount! > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      {featured ? (
        <div className="md:px-5 md:pt-4">
          <HomeHero series={featured} />
        </div>
      ) : null}

      <UpNextRail />
      <ThisWeekRail />
      <FriendsRail />
      <RecommendationsRail />
      <TrendingRail />

      <NotificationSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}
