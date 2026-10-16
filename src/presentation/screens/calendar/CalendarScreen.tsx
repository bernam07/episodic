import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { hasAired, type Episode, type Season } from "@/domain/entities/Episode";
import type { SeriesDetail } from "@/domain/entities/Series";
import { posterUrl } from "@/data/tmdb/images";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useLibrary, useToggleEpisode } from "@/presentation/hooks/useTracking";
import { queryKeys } from "@/presentation/hooks/queryKeys";
import { container } from "@/presentation/di/container";
import { ScreenHeader } from "@/presentation/layout/ScreenHeader";

type View = "week" | "month";

type AiringEntry = {
  tmdbId: number;
  seriesId: string;
  seriesName: string;
  posterPath: string | null;
  episode: Episode;
};

function iso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function windowFor(view: View, offset: number): { start: string; end: string; label: string } {
  const now = new Date();

  if (view === "week") {
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const label =
      offset === 0
        ? "This week"
        : `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${sunday.toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric" }
          )}`;

    return { start: iso(monday), end: iso(sunday), label };
  }

  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return {
    start: iso(first),
    end: iso(last),
    label: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
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

function CalendarEntry({ item, watched }: { item: AiringEntry; watched: boolean }) {
  const toggle = useToggleEpisode(item.seriesId);
  const poster = posterUrl(item.posterPath, "w154");

  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-ink-850 p-3">
      <Link to={`/series/${item.tmdbId}`} className="tap-none flex min-w-0 flex-1 items-center gap-3 active:opacity-75">
        {poster ? (
          <img src={poster} alt="" loading="lazy" className="h-16 w-11 shrink-0 rounded-[8px] object-cover ring-1 ring-white/10 ring-inset" />
        ) : (
          <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded-[8px] bg-ink-800">
            <span className="text-[0.625rem] text-mist-500">N/A</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-white">{item.seriesName}</p>
          <p className="mt-0.5 text-[0.75rem] font-medium text-accent-400">
            S{item.episode.seasonNumber} · E{item.episode.episodeNumber}
          </p>
          {item.episode.name ? (
            <p className="mt-0.5 truncate text-[0.75rem] text-mist-500">{item.episode.name}</p>
          ) : null}
        </div>
      </Link>
      {hasAired(item.episode) ? (
        <button
          type="button"
          disabled={toggle.isPending}
          aria-pressed={watched}
          aria-label={`Mark S${item.episode.seasonNumber} E${item.episode.episodeNumber} ${watched ? "unwatched" : "watched"}`}
          onClick={() => toggle.mutate({ episode: item.episode, watched: !watched })}
          className={`tap-none flex size-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
            watched
              ? "bg-accent-500 text-white"
              : "bg-ink-800 text-mist-400 hover:bg-ink-700 active:bg-accent-500 active:text-white"
          }`}
        >
          {toggle.isPending ? (
            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3.5">
              <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      ) : (
        <span className="shrink-0 rounded-full bg-ink-800 px-2.5 py-1 text-[0.6875rem] font-medium text-mist-500">
          Upcoming
        </span>
      )}
    </div>
  );
}

export function CalendarScreen() {
  const [view, setView] = useState<View>("week");
  const [offset, setOffset] = useState(0);
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
    })),
  });

  const tmdbToSeriesId = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of activeSeries) map.set(item.tmdbId, item.seriesId);
    return map;
  }, [activeSeries]);

  const airing = useMemo(() => {
    const list: { tmdbId: number; seriesId: string; name: string; posterPath: string | null; season: number }[] = [];
    const seen = new Set<string>();
    for (const query of detailQueries) {
      const detail = query.data as SeriesDetail | undefined;
      const sid = detail ? tmdbToSeriesId.get(detail.tmdbId) : undefined;
      if (!detail || !sid) continue;
      for (const season of [detail.lastEpisodeToAir?.seasonNumber, detail.nextEpisodeToAir?.seasonNumber]) {
        if (!season) continue;
        const key = `${detail.tmdbId}:${season}`;
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ tmdbId: detail.tmdbId, seriesId: sid, name: detail.name, posterPath: detail.posterPath, season });
      }
    }
    return list;
  }, [detailQueries, tmdbToSeriesId]);

  const seasonQueries = useQueries({
    queries: airing.map((item) => ({
      queryKey: queryKeys.season(item.tmdbId, item.season),
      queryFn: () => container.usecases.getSeason.execute(item.tmdbId, item.season),
      staleTime: 1000 * 60 * 60 * 12,
    })),
  });

  const watchedQueries = useQueries({
    queries: airing.map((item) => ({
      queryKey: queryKeys.watchedEpisodes(item.seriesId),
      queryFn: () => container.usecases.getWatchedEpisodes.execute(item.seriesId),
      staleTime: 1000 * 30,
    })),
  });

  const watchedBySeries = useMemo(() => {
    const map = new Map<string, Set<number>>();
    watchedQueries.forEach((query, index) => {
      const meta = airing[index];
      if (meta && query.data) map.set(meta.seriesId, query.data as Set<number>);
    });
    return map;
  }, [watchedQueries, airing]);

  const isLoading =
    libraryLoading || detailQueries.some((q) => q.isLoading) || seasonQueries.some((q) => q.isLoading);
  const hasError =
    detailQueries.some((q) => q.isError) || seasonQueries.some((q) => q.isError);

  const { start, end, label } = windowFor(view, offset);

  const grouped = useMemo(() => {
    const result: AiringEntry[] = [];
    seasonQueries.forEach((query, index) => {
      const season = query.data as Season | undefined;
      const meta = airing[index];
      if (!season || !meta) return;
      for (const episode of season.episodes) {
        if (episode.airDate && episode.airDate >= start && episode.airDate <= end) {
          result.push({ tmdbId: meta.tmdbId, seriesId: meta.seriesId, seriesName: meta.name, posterPath: meta.posterPath, episode });
        }
      }
    });

    result.sort(
      (a, b) =>
        (a.episode.airDate ?? "").localeCompare(b.episode.airDate ?? "") ||
        a.seriesName.localeCompare(b.seriesName)
    );

    const map = new Map<string, AiringEntry[]>();
    for (const entry of result) {
      const day = entry.episode.airDate as string;
      const arr = map.get(day) ?? [];
      arr.push(entry);
      map.set(day, arr);
    }
    return { days: [...map.entries()], total: result.length };
  }, [seasonQueries, airing, start, end]);

  function switchView(next: View) {
    setView(next);
    setOffset(0);
  }

  return (
    <>
      <ScreenHeader
        title="Calendar"
        subtitle={
          !isLoading && grouped.total > 0
            ? `${grouped.total} ${grouped.total === 1 ? "episode" : "episodes"}`
            : undefined
        }
      />

      <div className="ios-material sticky top-0 z-20 border-b border-white/[0.08] px-5 pt-2.5 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-[9px] bg-ink-850 p-[2px]">
            {(["week", "month"] as View[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => switchView(value)}
                className={`tap-none min-h-[30px] rounded-[7px] px-4 text-[0.8125rem] font-semibold transition-all duration-150 ${
                  view === value
                    ? "bg-ink-700 text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                    : "text-mist-400 active:text-mist-200"
                }`}
              >
                {value === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1">
            {offset !== 0 ? (
              <button
                type="button"
                onClick={() => setOffset(0)}
                className="tap-none mr-1 rounded-full bg-ink-850 px-3 py-1.5 text-[0.75rem] font-semibold text-accent-500 active:bg-ink-800"
              >
                Today
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setOffset((o) => o - 1)}
              aria-label="Previous"
              className="tap-none flex size-8 items-center justify-center rounded-full bg-ink-850 text-accent-500 active:bg-ink-800"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setOffset((o) => o + 1)}
              aria-label="Next"
              className="tap-none flex size-8 items-center justify-center rounded-full bg-ink-850 text-accent-500 active:bg-ink-800"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <p className="mt-2.5 text-[1.0625rem] font-bold tracking-[-0.015em] text-white">{label}</p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : hasError && grouped.total === 0 ? (
        <div className="px-5 pt-10 text-center">
          <p className="text-[1.0625rem] font-semibold text-white">Could not load schedule</p>
          <p className="mt-1 text-[0.875rem] text-mist-500">
            Something went wrong fetching episode data. Try again later.
          </p>
        </div>
      ) : grouped.total === 0 ? (
        <div className="px-5 pt-10 text-center">
          <p className="text-[1.0625rem] font-semibold text-white">Nothing airing in {view === "week" ? "this week" : "this period"}</p>
          <p className="mt-1 text-[0.875rem] text-mist-500">
            Episodes from your Watching and Want to Watch series show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-6 px-5 pt-3">
          {grouped.days.map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-2.5 text-[1.0625rem] font-bold tracking-[-0.015em] text-white">
                {formatDay(date)}
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <CalendarEntry
                    key={`${item.tmdbId}-${item.episode.tmdbEpisodeId}`}
                    item={item}
                    watched={watchedBySeries.get(item.seriesId)?.has(item.episode.tmdbEpisodeId) ?? false}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
