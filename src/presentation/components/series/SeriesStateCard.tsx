import {
  airedEpisodeCount,
  airingStatus,
  describeWatchState,
  hasUpcomingSeason,
  isFinished,
  type WatchState,
} from "@/domain/entities/Airing";
import type { SeriesDetail } from "@/domain/entities/Series";
import type { SeriesStatus } from "@/domain/entities/SeriesStatus";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";
import { formatDate } from "@/presentation/utils/date";
import { plural } from "@/presentation/utils/plural";

const AIRING_LABELS: Record<ReturnType<typeof airingStatus>, string> = {
  ended: "Ended",
  returning: "Returning series",
  in_production: "In production",
  planned: "Planned",
  unknown: "Status unknown",
};

type Copy = {
  headline: string;
  detail: string | null;
  tone: "neutral" | "positive" | "action";
};

function toCopy(state: WatchState, detail: SeriesDetail): Copy {
  const today = new Date().toISOString().slice(0, 10);
  const upcomingSeason = detail.seasonsMeta.find(
    (season) =>
      season.seasonNumber > 0 &&
      (!season.airDate || season.airDate > today || season.episodeCount === 0)
  );

  switch (state.kind) {
    case "untracked":
      return {
        headline: AIRING_LABELS[airingStatus(detail)],
        detail:
          state.totalEpisodes > 0
            ? `${plural(state.totalEpisodes, "episode")} across ${plural(detail.numberOfSeasons, "season")}`
            : null,
        tone: "neutral",
      };

    case "not_started":
      return {
        headline: "Not started",
        detail: state.airedEpisodes > 0 ? `${plural(state.airedEpisodes, "episode")} ready to watch` : null,
        tone: "action",
      };

    case "behind":
      return {
        headline: `${plural(state.behind, "episode")} behind`,
        detail: `You've seen ${state.watchedEpisodes} of ${state.airedEpisodes} aired`,
        tone: "action",
      };

    case "up_to_date": {
      const next = state.nextEpisode;
      const nextDate = formatDate(next?.airDate ?? null);

      if (next && nextDate) {
        return {
          headline: "You're up to date",
          detail: `Next: S${next.seasonNumber}E${next.episodeNumber} on ${nextDate}`,
          tone: "positive",
        };
      }

      const seasonDate = formatDate(upcomingSeason?.airDate ?? null);
      if (upcomingSeason && seasonDate) {
        return {
          headline: "You're up to date",
          detail: `${upcomingSeason.name} premieres on ${seasonDate}`,
          tone: "positive",
        };
      }

      if (state.unairedEpisodes > 0 || detail.inProduction || Boolean(upcomingSeason)) {
        return {
          headline: "You're up to date",
          detail: "More episodes are still coming",
          tone: "positive",
        };
      }

      return {
        headline: "You're up to date",
        detail: "Caught up on everything aired so far",
        tone: "positive",
      };
    }

    case "completed":
      return {
        headline: "You finished this series",
        detail: "Every episode watched, and there are no more coming",
        tone: "positive",
      };

    case "abandoned":
      return {
        headline: "Abandoned",
        detail:
          state.watchedEpisodes > 0
            ? `Stopped after ${plural(state.watchedEpisodes, "episode")}`
            : "Never started",
        tone: "neutral",
      };
  }
}

const DOTS: Record<Copy["tone"], string> = {
  neutral: "bg-mist-400",
  positive: "bg-[#38bdf8]",
  action: "bg-accent-500",
};

type SeriesStateCardProps = {
  detail: SeriesDetail;
  watchedEpisodes: number;
  status: SeriesStatus | null;
};

export function SeriesStateCard({ detail, watchedEpisodes, status }: SeriesStateCardProps) {
  const state = describeWatchState(detail, watchedEpisodes, status);
  const copy = toCopy(state, detail);
  const tracked = status !== null;
  const aired = airedEpisodeCount(detail);
  const continuing =
    !isFinished(detail) ||
    detail.inProduction ||
    Boolean(detail.nextEpisodeToAir) ||
    hasUpcomingSeason(detail.seasonsMeta, detail.tmdbStatus);
  const targetTotal = continuing && aired > 0 ? aired : detail.numberOfEpisodes;
  const percent = targetTotal > 0 ? Math.min((watchedEpisodes / targetTotal) * 100, 100) : 0;
  const dotClass = state.kind === "completed" ? "bg-[#30d158]" : DOTS[copy.tone];

  return (
    <div className="rounded-[14px] border border-white/[0.07] bg-ink-850 p-4">
      <div className="flex items-start gap-2.5">
        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dotClass}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-semibold text-white">{copy.headline}</p>
          {copy.detail ? <p className="mt-0.5 text-[0.8125rem] text-mist-400">{copy.detail}</p> : null}
        </div>
        <span className="shrink-0 rounded-full border border-white/[0.07] bg-ink-800 px-2.5 py-1 text-[0.6875rem] font-semibold text-mist-300">
          {AIRING_LABELS[airingStatus(detail)]}
        </span>
      </div>

      {tracked && targetTotal > 0 ? (
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[0.75rem] font-medium text-mist-500">Progress</span>
            <span className="text-[0.75rem] tabular-nums text-mist-500">
              {watchedEpisodes}/{targetTotal}{" "}
              {continuing && detail.numberOfEpisodes > targetTotal ? "aired episodes" : "episodes"}
            </span>
          </div>
          <ProgressBar value={percent} showLabel />
        </div>
      ) : null}
    </div>
  );
}
