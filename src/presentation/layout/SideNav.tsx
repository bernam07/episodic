import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Avatar } from "@/presentation/components/social/Avatar";
import { DeleteAccountSheet } from "@/presentation/components/social/DeleteAccountSheet";
import { SettingsSheet } from "@/presentation/components/social/SettingsSheet";
import { BrandMark } from "@/presentation/components/ui/BrandMark";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import { NAV_TABS } from "./navigation";
import { useTabReselect } from "./useTabReselect";

export function SideNav() {
  const { profile, signOut } = useAuth();
  const onTabClick = useTabReselect();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key === "k")) &&
        !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        navigate("/search");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <>
      <aside className="ios-material fixed inset-y-0 left-0 z-40 hidden w-60 flex-col justify-between border-r border-white/[0.1] px-3.5 py-6 md:flex">
        <div>
          <div className="px-2.5 pb-6">
            <div className="flex items-center gap-2.5">
              <BrandMark size="md" />
              <p className="text-[1.25rem] font-extrabold tracking-[-0.025em] text-white">
                Episodic
              </p>
            </div>
            {profile ? (
              <p className="mt-1 truncate text-[0.75rem] text-mist-500">
                {profile.displayName || profile.username}
              </p>
            ) : null}
          </div>

          <nav>
            <ul className="flex flex-col gap-1">
              {NAV_TABS.map((tab) => (
                <li key={tab.to}>
                  <NavLink
                    to={tab.to}
                    end={tab.to === "/"}
                    onClick={onTabClick(tab.to)}
                    className={({ isActive }) =>
                      `tap-none flex min-h-[2.625rem] items-center justify-between rounded-[10px] px-3 text-[0.9375rem] transition-colors duration-150 ${
                        isActive
                          ? "bg-white/[0.12] font-semibold text-white"
                          : "font-medium text-mist-400 hover:bg-white/[0.06] hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="flex items-center gap-3">
                          <span className={isActive ? "text-accent-500" : "text-mist-400"}>
                            {tab.icon}
                          </span>
                          {t(tab.key)}
                        </span>
                        {tab.key === "search" ? (
                          <kbd className="rounded-[5px] border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[0.6875rem] font-medium text-mist-400">
                            /
                          </kbd>
                        ) : null}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}

              <li>
                <NavLink
                  to="/calendar"
                  className={({ isActive }) =>
                    `tap-none flex min-h-[2.625rem] items-center gap-3 rounded-[10px] px-3 text-[0.9375rem] transition-colors duration-150 ${
                      isActive
                        ? "bg-white/[0.12] font-semibold text-white"
                        : "font-medium text-mist-400 hover:bg-white/[0.06] hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`size-6 ${isActive ? "text-accent-500" : "text-mist-400"}`}
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t("calendar")}
                    </>
                  )}
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/stats"
                  className={({ isActive }) =>
                    `tap-none flex min-h-[2.625rem] items-center gap-3 rounded-[10px] px-3 text-[0.9375rem] transition-colors duration-150 ${
                      isActive
                        ? "bg-white/[0.12] font-semibold text-white"
                        : "font-medium text-mist-400 hover:bg-white/[0.06] hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`size-6 ${isActive ? "text-accent-500" : "text-mist-400"}`}
                      >
                        <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t("stats")}
                    </>
                  )}
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        {profile ? (
          <div className="rounded-card border border-white/[0.08] bg-ink-850 p-3">
            <div className="flex items-center gap-3">
              <Avatar
                username={profile.username}
                displayName={profile.displayName}
                avatarUrl={profile.avatarUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-semibold text-white">
                  {profile.displayName || profile.username}
                </p>
                <p className="truncate text-[0.6875rem] text-mist-500">@{profile.username}</p>
              </div>
            </div>
            <div className="mt-2.5 flex gap-1.5 border-t border-white/[0.08] pt-2.5">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="tap-none flex flex-1 items-center justify-center gap-1.5 rounded-[8px] py-1.5 text-[0.75rem] font-medium text-mist-400 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                {t("settings")}
              </button>
              <button
                type="button"
                onClick={() => void signOut()}
                className="tap-none flex flex-1 items-center justify-center gap-1.5 rounded-[8px] py-1.5 text-[0.75rem] font-medium text-mist-400 transition-colors hover:bg-white/[0.08] hover:text-danger-500"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                {t("signOut")}
              </button>
            </div>
          </div>
        ) : null}
      </aside>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onDeleteAccount={() => {
          setSettingsOpen(false);
          setDeleteAccountOpen(true);
        }}
      />

      <DeleteAccountSheet
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        username={profile?.username ?? ""}
      />
    </>
  );
}
