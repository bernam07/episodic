import type { RatingSummary } from "@/domain/entities/RatingSummary";
import { plural } from "@/presentation/utils/plural";

export function RatingSummaryCard({ summary }: { summary: RatingSummary }) {
  if (summary.total === 0) {
    return null;
  }

  const max = Math.max(...summary.buckets.map((bucket) => bucket.count), 1);

  return (
    <div className="flex items-stretch gap-4 rounded-2xl border border-white/[0.08] bg-ink-900/60 p-4.5 backdrop-blur-xl shadow-lg">
      <div className="flex shrink-0 flex-col justify-center pr-4 text-center">
        <p className="text-[32px] leading-none font-black tabular-nums text-white">
          {summary.average?.toFixed(1)}
        </p>
        <div className="mt-1.5 flex items-center justify-center gap-0.5 text-amber-400">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <p className="mt-1 text-[11px] font-medium text-mist-400">{plural(summary.total, "rating", "ratings")}</p>
      </div>

      <div className="flex flex-1 items-end gap-1.5">
        {summary.buckets.map((bucket) => (
          <div key={bucket.rating} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-14 w-full items-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-accent-600 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.25)] transition-all duration-300"
                style={{ height: `${bucket.count === 0 ? 0 : Math.max((bucket.count / max) * 100, 8)}%` }}
                title={`${bucket.rating}★ · ${bucket.count}`}
              />
            </div>
            <span className="text-[10px] font-semibold tabular-nums text-mist-500">{bucket.rating}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
