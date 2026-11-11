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
import { useI18n } from "@/presentation/i18n/I18nProvider";
import type { TranslationKey } from "@/presentation/i18n/translations";
import { formatDate } from "@/presentation/utils/date";

const AIRING_KEYS: Record<ReturnType<typeof airingStatus>, TranslationKey> = {
  ended: "stateEnded",
  returning: "stateReturning",
  in_production: "stateInProduction",
  planned: "statePlanned",
  unknown: "stateUnknown",
};

type Copy = {
  headline: string;
  detail: string | null;
  tone: "neutral" | "positive" | "action";
};

function toCopy(
  state: WatchState,
  detail: SeriesDetail,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
): Copy {
  const today = new Date().toISOString().slice(0, 10);
  const upcomingSeason = detail.seasonsMeta.find(
    (season) =>
      season.seasonNumber > 0 &&
      (!season.airDate || season.airDate > today || season.episodeCount === 0)
  );

  switch (state.kind) {
    case "untracked":
      return {
        headline: t(AIRING_KEYS[airingStatus(detail)]),
        detail:
          state.totalEpisodes > 0
            ? `${state.totalEpisodes} ${
                state.totalEpisodes === 1 ? t("episode").toLowerCase() : t("episodes").toLowerCase()
              } · ${detail.numberOfSeasons} ${
                detail.numberOfSeasons === 1 ? t("season").toLowerCase() : t("seasons").toLowerCase()
              }`
            : null,
        tone: "neutral",
      };

    case "not_started":
      return {
        headline: t("stateNotStarted"),
        detail:
          state.airedEpisodes > 0
            ? t("stateReadyToWatch", { count: state.airedEpisodes })
            : null,
        tone: "action",
      };

    case "behind":
      return {
        headline: t("stateBehind", { count: state.behind }),
        detail: t("stateSeenOfAired", {
          watched: state.watchedEpisodes,
          aired: state.airedEpisodes,
        }),
        tone: "action",
      };

    case "up_to_date": {
      const next = state.nextEpisode;
      const nextDate = formatDate(next?.airDate ?? null);

      if (next && nextDate) {
        return {
          headline: t("stateUpToDate"),
          detail: t("stateNextEpisodeOn", {
            code: `S${next.seasonNumber}E${next.episodeNumber}`,
            date: nextDate,
          }),
          tone: "positive",
        };
      }

      const seasonDate = formatDate(upcomingSeason?.airDate ?? null);
      if (upcomingSeason && seasonDate) {
        return {
          headline: t("stateUpToDate"),
          detail: t("stateSeasonPremieresOn", {
            season: upcomingSeason.name,
            date: seasonDate,
          }),
          tone: "positive",
        };
      }

      if (state.unairedEpisodes > 0 || detail.inProduction || Boolean(upcomingSeason)) {
        return {
          headline: t("stateUpToDate"),
          detail: t("stateMoreEpisodesComing"),
          tone: "positive",
        };
      }

      return {
        headline: t("stateUpToDate"),
        detail: t("stateCaughtUpAll"),
        tone: "positive",
      };
    }

    case "completed":
      return {
        headline: t("stateFinished"),
        detail: t("stateFinishedDetail"),
        tone: "positive",
      };

    case "abandoned":
      return {
        headline: t("abandoned"),
        detail:
          state.watchedEpisodes > 0
            ? t("stateStoppedAfter", { count: state.watchedEpisodes })
            : t("stateNeverStarted"),
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
  const { t } = useI18n();
  const state = describeWatchState(detail, watchedEpisodes, status);
  const copy = toCopy(state, detail, t);
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
          {t(AIRING_KEYS[airingStatus(detail)])}
        </span>
      </div>

      {tracked && targetTotal > 0 ? (
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[0.75rem] font-medium text-mist-500">{t("progressLabel")}</span>
            <span className="text-[0.75rem] tabular-nums text-mist-500">
              {watchedEpisodes}/{targetTotal}{" "}
              {continuing && detail.numberOfEpisodes > targetTotal
                ? t("airedEpisodesLabel")
                : t("episodes").toLowerCase()}
            </span>
          </div>
          <ProgressBar value={percent} showLabel />
        </div>
      ) : null}
    </div>
  );
}
