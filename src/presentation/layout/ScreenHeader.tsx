import type { ReactNode } from "react";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function ScreenHeader({ title, subtitle, action }: ScreenHeaderProps) {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/75 backdrop-blur-2xl">
      <div className="flex items-end justify-between gap-4 px-5 pt-3.5 pb-4">
        <div className="min-w-0">
          <h1 className="truncate text-[28px] font-extrabold tracking-tight text-white">{title}</h1>
          {subtitle ? <p className="mt-0.5 truncate text-[13px] font-medium text-mist-400">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    </header>
  );
}
