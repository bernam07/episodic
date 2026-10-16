import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import type { Season } from "@/domain/entities/Episode";
import type { SeriesDetail } from "@/domain/entities/Series";
import { container } from "@/presentation/di/container";
import { queryKeys } from "@/presentation/hooks/queryKeys";
import { SeriesPoster } from "@/presentation/components/series/SeriesPoster";
import { useLibrary } from "@/presentation/hooks/useTracking";
import { useI18n } from "@/presentation/i18n/I18nProvider";

function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function airLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function ThisWeekRail() {
  const { t } = useI18n();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (active) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setActive(true);
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active]);

  const { data: library } = useLibrary();
  const watching = useMemo(
    () => (library ?? []).filter((item) => item.status === "watching"),
    [library]
  );

  const detailQueries = useQueries({
    queries: watching.map((item) => ({
      queryKey: queryKeys.seriesDetail(item.tmdbId),
      queryFn: () => container.usecases.getSeriesDetail.execute(item.tmdbId),
      staleTime: 1000 * 60 * 60 * 12,
      enabled: active,
    })),
  });

  const queryClient = useQueryClient();
  const reconciledRef = useRef<Set<number>>(new Set());

  const airing = useMemo(() => {
    const list: { tmdbId: number; name: string; posterPath: string | null; season: number }[] = [];
    for (const query of detailQueries) {
      const detail = query.data as SeriesDetail | undefined;
      const season = detail?.nextEpisodeToAir?.seasonNumber;
      if (!detail || !season) continue;
      list.push({ tmdbId: detail.tmdbId, name: detail.name, posterPath: detail.posterPath, season });
    }
    return list;
  }, [detailQueries]);

  const seasonQueries = useQueries({
    queries: airing.map((item) => ({
      queryKey: queryKeys.season(item.tmdbId, item.season),
      queryFn: () => container.usecases.getSeason.execute(item.tmdbId, item.season),
      staleTime: 1000 * 60 * 60 * 12,
      enabled: active,
    })),
  });

  useEffect(() => {
    const today = isoDay(new Date());
    const detailByTmdb = new Map<number, SeriesDetail>();
    for (const query of detailQueries) {
      const detail = query.data as SeriesDetail | undefined;
      if (detail) detailByTmdb.set(detail.tmdbId, detail);
    }
    const storedByTmdb = new Map<number, number>();
    for (const item of watching) storedByTmdb.set(item.tmdbId, item.airedEpisodes);

    const bumps: { detail: SeriesDetail; aired: number }[] = [];
    seasonQueries.forEach((query, index) => {
      const season = query.data as Season | undefined;
      const meta = airing[index];
      if (!season || !meta || reconciledRef.current.has(meta.tmdbId)) return;

      const detail = detailByTmdb.get(meta.tmdbId);
      const stored = storedByTmdb.get(meta.tmdbId);
      if (!detail || stored === undefined) return;

      const airedInSeason = season.episodes.reduce(
        (max, ep) => (ep.airDate && ep.airDate <= today ? Math.max(max, ep.episodeNumber) : max),
        0
      );
      if (airedInSeason === 0) return;

      const prior = detail.seasonsMeta
        .filter((s) => s.seasonNumber < meta.season)
        .reduce((sum, s) => sum + s.episodeCount, 0);
      const trueAired = Math.min(prior + airedInSeason, detail.numberOfEpisodes);

      if (trueAired > stored) bumps.push({ detail, aired: trueAired });
    });

    if (bumps.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const { detail, aired } of bumps) {
        reconciledRef.current.add(detail.tmdbId);
        try {
          await container.repositories.series.cacheSeries(detail, aired);
        } catch {
          reconciledRef.current.delete(detail.tmdbId);
        }
      }
      if (!cancelled) {
        queryClient.invalidateQueries({ queryKey: queryKeys.upNext });
        queryClient.invalidateQueries({ queryKey: ["library"] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [seasonQueries, airing, detailQueries, watching, queryClient]);

  const [weekRange] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(today.getDate() + 6);
    return { start: isoDay(today), endStr: isoDay(end) };
  });

  const items = useMemo(() => {
    const { start, endStr } = weekRange;

    const result: {
      tmdbId: number;
      name: string;
      posterPath: string | null;
      season: number;
      episode: number;
      airDate: string;
      key: number;
    }[] = [];

    seasonQueries.forEach((query, index) => {
      const season = query.data as Season | undefined;
      const meta = airing[index];
      if (!season || !meta) return;
      for (const episode of season.episodes) {
        if (episode.airDate && episode.airDate >= start && episode.airDate <= endStr) {
          result.push({
            tmdbId: meta.tmdbId,
            name: meta.name,
            posterPath: meta.posterPath,
            season: episode.seasonNumber,
            episode: episode.episodeNumber,
            airDate: episode.airDate,
            key: episode.tmdbEpisodeId,
          });
        }
      }
    });

    return result.sort((a, b) => a.airDate.localeCompare(b.airDate) || a.name.localeCompare(b.name));
  }, [seasonQueries, airing, weekRange]);

  if (items.length === 0) {
    return <div ref={sentinelRef} className="h-0" aria-hidden="true" />;
  }

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-baseline justify-between px-5">
        <h2 className="text-[1.1875rem] font-bold tracking-[-0.015em] text-white">{t("thisWeek")}</h2>
        <Link to="/calendar" className="tap-none text-[0.9375rem] font-normal text-accent-500 active:opacity-70">
          {t("calendar")}
        </Link>
      </div>
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-5 pb-1">
        {items.map((item) => (
          <Link
            key={`${item.tmdbId}-${item.key}`}
            to={`/series/${item.tmdbId}`}
            className="tap-none w-[124px] shrink-0 active:opacity-75"
          >
            <SeriesPoster path={item.posterPath} alt={item.name} />
            <p className="mt-2 truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-white">{item.name}</p>
            <p className="mt-0.5 text-[0.75rem] font-medium text-accent-400">
              S{item.season} · E{item.episode}
            </p>
            <p className="text-[0.75rem] text-mist-500">{airLabel(item.airDate)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
