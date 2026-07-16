import { NavLink } from "react-router-dom";
import { NAV_TABS } from "./navigation";

export function BottomNavBar() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-ink-700/70 bg-ink-900/85 backdrop-blur-xl md:hidden">
      <ul className="flex items-stretch justify-around px-2">
        {NAV_TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === "/"}
              className={({ isActive }) =>
                `tap-none flex min-h-[52px] flex-col items-center justify-center gap-1 pt-2 pb-1 transition-colors ${
                  isActive ? "text-accent-400" : "text-mist-500"
                }`
              }
            >
              {tab.icon}
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
