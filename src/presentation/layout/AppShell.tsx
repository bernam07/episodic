import { Outlet } from "react-router-dom";
import { useSyncContinuingSeries } from "@/presentation/hooks/useTracking";
import { BottomNavBar } from "./BottomNavBar";
import { SideNav } from "./SideNav";

export function AppShell() {
  useSyncContinuingSeries();

  return (
    <div className="relative min-h-dvh bg-ink-950 text-mist-100">
      <SideNav />
      <div className="pl-safe pr-safe md:pl-60">
        <main className="no-scrollbar relative mx-auto min-h-dvh w-full max-w-screen-sm pb-[calc(env(safe-area-inset-bottom)+3.75rem)] md:max-w-5xl md:pb-12">
          <Outlet />
        </main>
      </div>
      <BottomNavBar />
    </div>
  );
}
