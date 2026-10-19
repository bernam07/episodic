import type { ReactNode } from "react";

export function durationParts(minutes: number): { value: number; unit: string }[] {
  const totalHours = Math.floor(minutes / 60);

  if (totalHours < 1) {
    return [{ value: minutes, unit: "m" }];
  }

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days < 1) {
    return [{ value: totalHours, unit: "h" }];
  }

  return hours > 0
    ? [
        { value: days, unit: "d" },
        { value: hours, unit: "h" },
      ]
    : [{ value: days, unit: "d" }];
}

export function Duration({ minutes, className = "" }: { minutes: number; className?: string }) {
  return (
    <span className={`whitespace-nowrap ${className}`.trim()}>
      {durationParts(minutes).map((part, index) => (
        <span key={part.unit}>
          {index > 0 ? <span className="mr-1" /> : null}
          {part.value}
          <span className="ml-0.5 text-[0.55em] font-semibold text-mist-400">{part.unit}</span>
        </span>
      ))}
    </span>
  );
}

export function SectionHeading({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 px-5">
      <h2 className="text-[1.1875rem] font-bold tracking-[-0.015em] text-white">{children}</h2>
      {hint ? <span className="shrink-0 text-[0.8125rem] text-mist-500">{hint}</span> : null}
    </div>
  );
}

export function InlineStat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[1.125rem] leading-none font-bold tabular-nums text-white sm:text-[1.25rem]">
        {value}
      </p>
      <p className="mt-1.5 truncate text-[0.75rem] text-mist-500">{label}</p>
    </div>
  );
}
