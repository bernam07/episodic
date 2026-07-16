import { useState } from "react";
import { SERIES_STATUS_LABELS, SERIES_STATUSES, type SeriesStatus } from "@/domain/entities/SeriesStatus";
import { SeriesCard } from "@/presentation/components/series/SeriesCard";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useLibrary } from "@/presentation/hooks/useTracking";
import { ScreenHeader } from "@/presentation/layout/ScreenHeader";

export function LibraryScreen() {
  const [status, setStatus] = useState<SeriesStatus>("watching");
  const { data, isLoading } = useLibrary(status);

  return (
    <>
      <ScreenHeader title="Library" />

      <div className="no-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto bg-ink-950/80 px-5 pb-4 backdrop-blur-xl">
        {SERIES_STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`tap-none min-h-[36px] shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              status === value ? "bg-accent-600 text-white" : "bg-ink-800 text-mist-400 active:bg-ink-700"
            }`}
          >
            {SERIES_STATUS_LABELS[value]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : null}

      {!isLoading && data && data.length === 0 ? (
        <p className="px-5 pt-8 text-center text-[14px] text-mist-500">
          Nothing in {SERIES_STATUS_LABELS[status]} yet.
        </p>
      ) : null}

      {data && data.length > 0 ? (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {data.map((item) => (
            <SeriesCard
              key={item.seriesId}
              tmdbId={item.tmdbId}
              name={item.name}
              posterPath={item.posterPath}
              caption={`${item.watchedEpisodes}/${item.numberOfEpisodes} episodes`}
              progressPercent={item.progressPercent}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
