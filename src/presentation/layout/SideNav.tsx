import { NavLink } from "react-router-dom";
import { useAuth } from "@/presentation/hooks/useAuth";
import { NAV_TABS } from "./navigation";
import { useTabReselect } from "./useTabReselect";

export function SideNav() {
  const { profile } = useAuth();
  const onTabClick = useTabReselect();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-ink-800 bg-ink-900 px-4 py-6 md:flex">
      <div className="px-2 pb-8">
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
                  `tap-none flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors ${
                    isActive
                      ? "bg-accent-600/15 text-accent-300"
                      : "text-mist-400 hover:bg-ink-800 hover:text-mist-200"
                  }`
                }
              >
                {tab.icon}
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
