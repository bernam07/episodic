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
      <header className="sticky top-0 z-30 flex items-start justify-between border-b border-white/[0.06] bg-ink-950/75 px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-4 backdrop-blur-2xl">
        <div>
          <p className="text-[12px] font-medium tracking-wide text-mist-400">
            {profile ? `${greet}, ${profile.displayName || profile.username}` : greet}
          </p>
          <h1 className="bg-gradient-to-r from-white via-mist-100 to-mist-300 bg-clip-text text-[28px] font-black tracking-tight text-transparent">
            Episodic
          </h1>
        </div>
        <div className="mt-2 flex gap-2">
          <Link
            to="/calendar"
            className="tap-none flex size-10 items-center justify-center rounded-full border border-white/10 bg-ink-850/80 text-mist-300 shadow-sm backdrop-blur-md transition-all active:scale-95 hover:border-white/20 hover:text-white"
            aria-label={t("calendar")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="tap-none relative flex size-10 items-center justify-center rounded-full border border-white/10 bg-ink-850/80 text-mist-300 shadow-sm backdrop-blur-md transition-all active:scale-95 hover:border-white/20 hover:text-white"
            aria-label={t("notifications")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {(unreadCount ?? 0) > 0 ? (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gradient-to-tr from-accent-600 to-indigo-500 text-[10px] font-bold text-white shadow-md shadow-accent-600/40 ring-2 ring-ink-950">
                {unreadCount! > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      {featured ? (
        <div className="md:px-5">
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
