type ProgressBarProps = {
  value: number;
  className?: string;
  showLabel?: boolean;
};

export function ProgressBar({ value, className = "", showLabel = false }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800 ring-1 ring-white/[0.05]"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-600 via-accent-500 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)] transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel ? (
        <span className="w-10 shrink-0 text-right text-[11px] font-medium tabular-nums text-mist-400">
          {Math.round(clamped)}%
        </span>
      ) : null}
    </div>
  );
}
