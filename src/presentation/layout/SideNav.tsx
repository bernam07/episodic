import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Avatar } from "@/presentation/components/social/Avatar";
import { DeleteAccountSheet } from "@/presentation/components/social/DeleteAccountSheet";
import { SettingsSheet } from "@/presentation/components/social/SettingsSheet";
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col justify-between border-r border-ink-800 bg-ink-900 px-4 py-6 md:flex">
        <div>
          <div className="px-2 pb-6">
            <p className="text-[20px] font-bold tracking-tight text-mist-100">Episodic</p>
            {profile ? (
              <p className="mt-0.5 truncate text-[12px] text-mist-500">
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
                      `tap-none flex min-h-[44px] items-center justify-between rounded-xl px-3 text-[14px] font-medium transition-colors ${
                        isActive
                          ? "bg-accent-600/15 text-accent-300"
                          : "text-mist-400 hover:bg-ink-800 hover:text-mist-200"
                      }`
                    }
                  >
                    <span className="flex items-center gap-3">
                      {tab.icon}
                      {t(tab.key)}
                    </span>
                    {tab.key === "search" ? (
                      <kbd className="rounded border border-ink-700 bg-ink-800 px-1.5 py-0.5 text-[10px] font-semibold text-mist-500">
                        /
                      </kbd>
                    ) : null}
                  </NavLink>
                </li>
              ))}

              <li>
                <NavLink
                  to="/calendar"
                  className={({ isActive }) =>
                    `tap-none flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors ${
                      isActive
                        ? "bg-accent-600/15 text-accent-300"
                        : "text-mist-400 hover:bg-ink-800 hover:text-mist-200"
                    }`
                  }
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6">
                    <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t("calendar")}
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/stats"
                  className={({ isActive }) =>
                    `tap-none flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors ${
                      isActive
                        ? "bg-accent-600/15 text-accent-300"
                        : "text-mist-400 hover:bg-ink-800 hover:text-mist-200"
                    }`
                  }
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6">
                    <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t("stats")}
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        {profile ? (
          <div className="rounded-2xl border border-ink-800 bg-ink-850 p-3">
            <div className="flex items-center gap-3">
              <Avatar
                username={profile.username}
                displayName={profile.displayName}
                avatarUrl={profile.avatarUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-mist-100">
                  {profile.displayName || profile.username}
                </p>
                <p className="truncate text-[11px] text-mist-500">@{profile.username}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 border-t border-ink-800 pt-2.5">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="tap-none flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium text-mist-400 transition-colors hover:bg-ink-800 hover:text-mist-200"
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
                className="tap-none flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium text-mist-400 transition-colors hover:bg-ink-800 hover:text-danger-500"
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
