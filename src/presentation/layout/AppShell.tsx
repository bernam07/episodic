import { Outlet } from "react-router-dom";
import { BottomNavBar } from "./BottomNavBar";
import { SideNav } from "./SideNav";

export function AppShell() {
  return (
    <div className="relative min-h-dvh bg-ink-950 text-mist-100">
      <SideNav />
      <div className="pl-safe pr-safe md:pl-60">
        <main className="no-scrollbar relative mx-auto min-h-dvh w-full max-w-screen-sm pb-[calc(env(safe-area-inset-bottom)+4.75rem)] md:max-w-5xl md:pb-12">
          <Outlet />
        </main>
      </div>
      <BottomNavBar />
    </div>
  );
}
