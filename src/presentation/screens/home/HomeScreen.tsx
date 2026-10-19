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

type HomeTab = "for_you" | "friends" | "trending" | "schedule";

export function HomeScreen() {
  const { language, t } = useI18n();
  const { profile } = useAuth();
  const { data: trending } = useTrending();
  const { data: unreadCount } = useUnreadCount();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTab>("for_you");
  const featured = trending?.results[0];
  const greet = greeting(language);

  const tabs: { id: HomeTab; label: string }[] = [
    { id: "for_you", label: language === "pt" ? "Para Ti" : "For You" },
    { id: "friends", label: t("friends") },
    { id: "trending", label: language === "pt" ? "Em Alta" : "Trending" },
    { id: "schedule", label: t("thisWeek") },
  ];

  return (
    <>
      <header className="ios-material sticky top-0 z-30 border-b border-white/[0.08] pt-[calc(env(safe-area-inset-top)+0.625rem)]">
        <div className="flex items-center justify-between px-5 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-[9px] bg-accent-500 text-white shadow-[0_2px_10px_rgba(239,51,64,0.35)]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-[18px]">
                <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V5zm6 2.5v5l4.5-2.5L10 7.5z" />
              </svg>
            </span>
            <div>
              <h1 className="text-[1.25rem] leading-none font-extrabold tracking-[-0.025em] text-white">
                Episodic
              </h1>
              <p className="mt-0.5 text-[0.6875rem] font-medium text-mist-500">
                {profile ? `${greet}, ${profile.displayName || profile.username}` : greet}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/search"
              className="tap-none flex size-9 items-center justify-center rounded-full border border-white/[0.08] bg-ink-850 text-white transition-opacity active:opacity-70 hover:bg-ink-800"
              aria-label={t("search")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[17px]">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
            </Link>
            <Link
              to="/calendar"
              className="tap-none flex size-9 items-center justify-center rounded-full border border-white/[0.08] bg-ink-850 text-white transition-opacity active:opacity-70 hover:bg-ink-800"
              aria-label={t("calendar")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[17px]">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="tap-none relative flex size-9 items-center justify-center rounded-full border border-white/[0.08] bg-ink-850 text-white transition-opacity active:opacity-70 hover:bg-ink-800"
              aria-label={t("notifications")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[17px]">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {(unreadCount ?? 0) > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-500 px-1 text-[0.6875rem] font-bold text-white ring-2 ring-ink-950">
                  {unreadCount! > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="no-scrollbar flex gap-6 overflow-x-auto px-5">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`tap-none relative shrink-0 py-2.5 text-[0.875rem] font-semibold transition-colors ${
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
      </header>

      {activeTab === "for_you" ? (
        <>
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
        </>
      ) : null}

      {activeTab === "friends" ? <FriendsRail /> : null}

      {activeTab === "trending" ? (
        <>
          {featured ? (
            <div className="md:px-5 md:pt-4">
              <HomeHero series={featured} />
            </div>
          ) : null}
          <TrendingRail />
          <RecommendationsRail />
        </>
      ) : null}

      {activeTab === "schedule" ? (
        <>
          <UpNextRail />
          <ThisWeekRail />
        </>
      ) : null}

      <NotificationSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}
