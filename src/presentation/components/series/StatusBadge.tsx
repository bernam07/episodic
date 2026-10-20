import {
  formatSeriesStatusLabel,
  isContinuingSeries,
  type DisplaySeriesStatus,
  type SeriesStatus,
} from "@/domain/entities/SeriesStatus";
import { useI18n } from "@/presentation/i18n/I18nProvider";

const TONES: Record<DisplaySeriesStatus, string> = {
  want_to_watch: "bg-black/70 text-[#ffd60a] border border-white/15",
  watching: "bg-black/70 text-accent-400 border border-white/15",
  up_to_date: "bg-black/70 text-[#38bdf8] border border-white/15",
  watched: "bg-black/70 text-[#30d158] border border-white/15",
  abandoned: "bg-black/70 text-danger-500 border border-white/15",
};

const DOTS: Record<DisplaySeriesStatus, string> = {
  want_to_watch: "bg-[#ffd60a]",
  watching: "bg-accent-500",
  up_to_date: "bg-[#38bdf8]",
  watched: "bg-[#30d158]",
  abandoned: "bg-danger-500",
};

type StatusBadgeProps = {
  status: SeriesStatus | DisplaySeriesStatus;
  tmdbStatus?: string | null;
  hasUnairedSeason?: boolean;
  className?: string;
};

export function StatusBadge({
  status,
  tmdbStatus,
  hasUnairedSeason,
  className = "",
}: StatusBadgeProps) {
  const { t } = useI18n();
  const isUpToDate =
    status === "up_to_date" ||
    (status === "watched" && (isContinuingSeries(tmdbStatus) || Boolean(hasUnairedSeason)));
  const effectiveStatus: DisplaySeriesStatus = isUpToDate ? "up_to_date" : status;
  const tone = TONES[effectiveStatus];
  const dot = DOTS[effectiveStatus];
  const label = formatSeriesStatusLabel(effectiveStatus, tmdbStatus, t("upToDate"), {
    hasUnairedSeason,
  });

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold whitespace-nowrap backdrop-blur-md ${tone} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
