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
        className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.12]"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-accent-500 transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel ? (
        <span className="w-10 shrink-0 text-right text-[0.6875rem] font-medium tabular-nums text-mist-500">
          {Math.round(clamped)}%
        </span>
      ) : null}
    </div>
  );
}
