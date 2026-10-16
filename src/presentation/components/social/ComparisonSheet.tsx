import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { computeComparisonStats } from "@/domain/entities/Comparison";
import type { ComparisonItem } from "@/domain/entities/Comparison";
import { SERIES_STATUS_LABELS } from "@/domain/entities/SeriesStatus";
import { posterUrl } from "@/data/tmdb/images";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useCompareLibraries } from "@/presentation/hooks/useSocial";

type Tab = "both" | "only_me" | "only_them";

const TAB_LABELS: Record<Tab, string> = {
  both: "Both",
  only_me: "Only me",
  only_them: "Only them",
};

function filterByTab(items: ComparisonItem[], tab: Tab): ComparisonItem[] {
  switch (tab) {
    case "both":
      return items.filter((i) => i.myStatus && i.theirStatus);
    case "only_me":
      return items.filter((i) => i.myStatus && !i.theirStatus);
    case "only_them":
      return items.filter((i) => !i.myStatus && i.theirStatus);
  }
}

type ComparisonSheetProps = {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  displayName: string;
};

export function ComparisonSheet({ open, onClose, userId, displayName }: ComparisonSheetProps) {
  const { data, isLoading } = useCompareLibraries(open ? userId : null);
  const [tab, setTab] = useState<Tab>("both");

  const stats = useMemo(() => (data ? computeComparisonStats(data) : null), [data]);
  const visible = useMemo(() => (data ? filterByTab(data, tab) : []), [data, tab]);

  const tabCounts: Record<Tab, number> = stats
    ? { both: stats.both, only_me: stats.onlyMe, only_them: stats.onlyThem }
    : { both: 0, only_me: 0, only_them: 0 };

  return (
    <Sheet open={open} onClose={onClose} title={`Compare with ${displayName}`}>
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : !data || data.length === 0 ? (
        <p className="py-8 text-center text-[0.9375rem] text-mist-500">No series to compare yet.</p>
      ) : (
        <div className="pt-3">
          {stats ? (
            <div className="mb-5 flex items-center justify-center gap-3">
              <div className="flex size-16 flex-col items-center justify-center rounded-full border-2 border-accent-500">
                <span className="text-[1.125rem] font-bold leading-none tabular-nums text-white">
                  {stats.compatibilityPercent}%
                </span>
              </div>
              <div className="text-[0.8125rem] text-mist-400">
                <p>
                  <strong className="font-semibold text-white">{stats.both}</strong> in common
                </p>
                <p>
                  <strong className="font-semibold text-white">{stats.onlyMe}</strong> only you
                </p>
                <p>
                  <strong className="font-semibold text-white">{stats.onlyThem}</strong> only them
                </p>
              </div>
            </div>
          ) : null}

          <div className="mb-4 flex rounded-[9px] bg-ink-850 p-[2px]">
            {(["both", "only_me", "only_them"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`tap-none min-h-[32px] flex-1 rounded-[7px] text-[0.75rem] font-semibold transition-all duration-150 ${
                  tab === t
                    ? "bg-ink-700 text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                    : "text-mist-400 active:text-mist-200"
                }`}
              >
                {TAB_LABELS[t]} ({tabCounts[t]})
              </button>
            ))}
          </div>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {visible.map((item) => (
              <Link
                key={item.tmdbId}
                to={`/series/${item.tmdbId}`}
                onClick={onClose}
                className="tap-none flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-ink-850 p-2.5 active:bg-ink-800"
              >
                {posterUrl(item.posterPath, "w154") ? (
                  <img
                    src={posterUrl(item.posterPath, "w154")!}
                    alt=""
                    className="h-16 w-11 shrink-0 rounded-[8px] object-cover ring-1 ring-white/10 ring-inset"
                  />
                ) : (
                  <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded-[8px] bg-ink-800">
                    <span className="text-[0.625rem] text-mist-500">N/A</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.875rem] font-semibold text-white">{item.seriesName}</p>
                  <div className="mt-1 flex gap-3 text-[0.75rem]">
                    {item.myStatus ? (
                      <span className="text-accent-400">
                        You: {SERIES_STATUS_LABELS[item.myStatus]}
                        {item.myRating !== null ? ` · ${item.myRating.toFixed(1)}` : ""}
                      </span>
                    ) : (
                      <span className="text-mist-500">You: —</span>
                    )}
                    {item.theirStatus ? (
                      <span className="text-[#30d158]">
                        Them: {SERIES_STATUS_LABELS[item.theirStatus]}
                        {item.theirRating !== null ? ` · ${item.theirRating.toFixed(1)}` : ""}
                      </span>
                    ) : (
                      <span className="text-mist-500">Them: —</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}
