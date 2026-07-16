import { airingStatus, describeWatchState, type WatchState } from "@/domain/entities/Airing";
import type { SeriesDetail } from "@/domain/entities/Series";
import type { SeriesStatus } from "@/domain/entities/SeriesStatus";
import { ProgressBar } from "@/presentation/components/ui/ProgressBar";

const AIRING_LABELS: Record<ReturnType<typeof airingStatus>, string> = {
  ended: "Ended",
  returning: "Returning series",
  in_production: "In production",
  planned: "Planned",
  unknown: "Status unknown",
};

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

type Copy = {
  headline: string;
  detail: string | null;
  tone: "neutral" | "positive" | "action";
};

function toCopy(state: WatchState, detail: SeriesDetail): Copy {
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

      if (state.unairedEpisodes > 0 || detail.inProduction) {
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

const TONES: Record<Copy["tone"], string> = {
  neutral: "border-ink-700 bg-ink-850",
  positive: "border-accent-600/30 bg-accent-600/10",
  action: "border-ink-700 bg-ink-850",
};

const DOTS: Record<Copy["tone"], string> = {
  neutral: "bg-mist-500",
  positive: "bg-accent-400",
  action: "bg-star-500",
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
  const percent = detail.numberOfEpisodes > 0 ? (watchedEpisodes / detail.numberOfEpisodes) * 100 : 0;

  return (
    <div className={`rounded-card border p-4 ${TONES[copy.tone]}`}>
      <div className="flex items-start gap-2.5">
        <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${DOTS[copy.tone]}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-mist-100">{copy.headline}</p>
          {copy.detail ? <p className="mt-0.5 text-[13px] text-mist-400">{copy.detail}</p> : null}
        </div>
        <span className="shrink-0 rounded-full bg-ink-800 px-2.5 py-1 text-[10px] font-medium tracking-wide text-mist-400 uppercase">
          {AIRING_LABELS[airingStatus(detail)]}
        </span>
      </div>

      {tracked && detail.numberOfEpisodes > 0 ? (
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[11px] font-medium text-mist-500">Progress</span>
            <span className="text-[11px] tabular-nums text-mist-500">
              {watchedEpisodes}/{detail.numberOfEpisodes} episodes
            </span>
          </div>
          <ProgressBar value={percent} showLabel />
        </div>
      ) : null}
    </div>
  );
}
