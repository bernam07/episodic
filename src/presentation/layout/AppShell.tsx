import { Outlet } from "react-router-dom";
import { BottomNavBar } from "./BottomNavBar";
import { SideNav } from "./SideNav";

export function AppShell() {
  return (
    <div className="relative min-h-dvh bg-ink-950 text-mist-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-accent-600/10 blur-[130px]" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-violet-600/8 blur-[140px]" />
        <div className="absolute bottom-12 left-8 h-80 w-80 rounded-full bg-accent-500/6 blur-[120px]" />
      </div>
      <SideNav />
      <div className="pl-safe pr-safe md:pl-60">
        <main className="no-scrollbar relative mx-auto min-h-dvh w-full max-w-screen-sm pb-[calc(env(safe-area-inset-bottom)+76px)] md:max-w-5xl md:pb-12">
          <Outlet />
        </main>
      </div>
      <BottomNavBar />
    </div>
  );
}
