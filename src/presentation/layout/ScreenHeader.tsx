import type { ReactNode } from "react";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function ScreenHeader({ title, subtitle, action }: ScreenHeaderProps) {
  return (
    <header className="pt-safe ios-material sticky top-0 z-30 border-b border-white/[0.08]">
      <div className="flex items-end justify-between gap-4 px-5 pt-3 pb-3.5">
        <div className="min-w-0">
          <h1 className="truncate text-[2.125rem] leading-[1.12] font-bold tracking-[-0.022em] text-white">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[0.8125rem] font-normal text-mist-500">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
    </header>
  );
}
