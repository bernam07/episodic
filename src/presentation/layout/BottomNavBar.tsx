import { NavLink } from "react-router-dom";
import { useI18n } from "@/presentation/i18n/I18nProvider";
import { NAV_TABS } from "./navigation";
import { useTabReselect } from "./useTabReselect";

export function BottomNavBar() {
  const onTabClick = useTabReselect();
  const { t } = useI18n();

  return (
    <nav className="pb-safe ios-material fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] md:hidden">
      <ul className="flex items-stretch justify-around px-1">
        {NAV_TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === "/"}
              onClick={onTabClick(tab.to)}
              className={({ isActive }) =>
                `tap-none relative flex min-h-[3.375rem] flex-col items-center justify-center gap-1 pt-1.5 pb-1 transition-colors duration-150 ${
                  isActive ? "text-white" : "text-mist-500 active:text-mist-300"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">{tab.icon}</div>
                  <span
                    className={`text-[0.6875rem] leading-tight tracking-[-0.01em] ${
                      isActive ? "font-semibold text-white" : "font-medium text-mist-500"
                    }`}
                  >
                    {t(tab.key)}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
