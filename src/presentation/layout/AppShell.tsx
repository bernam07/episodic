import { Outlet } from "react-router-dom";
import { BottomNavBar } from "./BottomNavBar";
import { SideNav } from "./SideNav";

export function AppShell() {
  return (
    <div className="min-h-dvh bg-ink-950">
      <SideNav />
      <div className="pl-safe pr-safe md:pl-60">
        <main className="no-scrollbar mx-auto min-h-dvh w-full max-w-screen-sm pb-[calc(env(safe-area-inset-bottom)+72px)] md:max-w-5xl md:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNavBar />
    </div>
  );
}
