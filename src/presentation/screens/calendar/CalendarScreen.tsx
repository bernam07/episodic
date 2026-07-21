import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import type { EpisodeStub } from "@/domain/entities/Airing";
import type { SeriesDetail } from "@/domain/entities/Series";
import { posterUrl } from "@/data/tmdb/images";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useLibrary } from "@/presentation/hooks/useTracking";
import { queryKeys } from "@/presentation/hooks/queryKeys";
import { container } from "@/presentation/di/container";
import { ScreenHeader } from "@/presentation/layout/ScreenHeader";

type AiringEntry = {
  tmdbId: number;
  seriesName: string;
  posterPath: string | null;
  episode: EpisodeStub;
  airDate: string;
};

function getWeekBounds(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";

  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export function CalendarScreen() {
  const { data: library, isLoading: libraryLoading } = useLibrary();

  const activeSeries = useMemo(
    () => (library ?? []).filter((item) => item.status === "watching" || item.status === "want_to_watch"),
    [library]
  );

  const detailQueries = useQueries({
    queries: activeSeries.map((item) => ({
      queryKey: queryKeys.seriesDetail(item.tmdbId),
      queryFn: () => container.usecases.getSeriesDetail.execute(item.tmdbId),
      staleTime: 1000 * 60 * 60 * 12,
      enabled: true,
    })),
  });

  const isLoading = libraryLoading || detailQueries.some((q) => q.isLoading);

  const entries = useMemo(() => {
    const { start, end } = getWeekBounds();
    const result: AiringEntry[] = [];

    for (const query of detailQueries) {
      if (!query.data) continue;
      const detail = query.data as SeriesDetail;
      const ep = detail.nextEpisodeToAir;
      if (!ep?.airDate) continue;
      if (ep.airDate >= start && ep.airDate <= end) {
        result.push({
          tmdbId: detail.tmdbId,
          seriesName: detail.name,
          posterPath: detail.posterPath,
          episode: ep,
          airDate: ep.airDate,
        });
      }
    }

    result.sort((a, b) => a.airDate.localeCompare(b.airDate) || a.seriesName.localeCompare(b.seriesName));
    return result;
  }, [detailQueries]);

  const grouped = useMemo(() => {
    const map = new Map<string, AiringEntry[]>();
    for (const entry of entries) {
      const arr = map.get(entry.airDate) ?? [];
      arr.push(entry);
      map.set(entry.airDate, arr);
    }
    return [...map.entries()];
  }, [entries]);

  return (
    <>
      <ScreenHeader
        title="This Week"
        subtitle={entries.length > 0 ? `${entries.length} episodes airing` : undefined}
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : entries.length === 0 ? (
        <div className="px-5 pt-10 text-center">
          <p className="text-[15px] font-semibold text-mist-200">Nothing airing this week</p>
          <p className="mt-1 text-[13px] text-mist-500">
            Episodes from your Watching and Want to Watch series will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-6 px-5">
          {grouped.map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
                {formatDay(date)}
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <Link
                    key={`${item.tmdbId}-${item.episode.tmdbEpisodeId}`}
                    to={`/series/${item.tmdbId}`}
                    className="tap-none flex items-center gap-3 rounded-xl bg-ink-850 p-3 active:bg-ink-800"
                  >
                    {posterUrl(item.posterPath, "w154") ? (
                      <img
                        src={posterUrl(item.posterPath, "w154")!}
                        alt=""
                        className="h-16 w-11 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-700">
                        <span className="text-[10px] text-mist-600">N/A</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-mist-100">
                        {item.seriesName}
                      </p>
                      <p className="mt-0.5 text-[12px] font-medium text-accent-400">
                        S{item.episode.seasonNumber} · E{item.episode.episodeNumber}
                      </p>
                      {item.episode.name ? (
                        <p className="mt-0.5 truncate text-[12px] text-mist-500">
                          {item.episode.name}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
