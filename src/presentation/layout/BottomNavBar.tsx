import { NavLink } from "react-router-dom";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import { NAV_TABS } from "./navigation";
import { useTabReselect } from "./useTabReselect";

export function BottomNavBar() {
  const onTabClick = useTabReselect();
  const { t } = useI18n();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink-950/85 backdrop-blur-2xl shadow-[0_-10px_35px_rgba(0,0,0,0.7)] md:hidden">
      <ul className="flex items-stretch justify-around px-2">
        {NAV_TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === "/"}
              onClick={onTabClick(tab.to)}
              className={({ isActive }) =>
                `tap-none relative flex min-h-[54px] flex-col items-center justify-center gap-1 pt-2 pb-1.5 transition-all duration-200 ${
                  isActive ? "text-accent-300 scale-[1.03]" : "text-mist-400 active:text-mist-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    {tab.icon}
                    {isActive ? (
                      <span className="absolute -inset-1 rounded-full bg-accent-400/20 blur-sm -z-10" />
                    ) : null}
                  </div>
                  <span className={`text-[10px] tracking-wide ${isActive ? "font-bold text-accent-300" : "font-medium"}`}>
                    {t(tab.key)}
                  </span>
                  {isActive ? (
                    <span className="absolute bottom-1 h-0.5 w-4 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(129,140,248,0.9)]" />
                  ) : null}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
