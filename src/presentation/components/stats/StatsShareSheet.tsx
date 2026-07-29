import { useEffect, useRef, useState } from "react";
import type { GenreCount } from "@/domain/entities/LibraryInsights";
import { Button } from "@/presentation/components/ui/Button";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { useAuth } from "@/presentation/hooks/useAuth";
import {
  canvasToBlob,
  drawStatsCard,
  type StatsCardBackground,
} from "@/presentation/utils/shareCard";

type StatsShareSheetProps = {
  open: boolean;
  onClose: () => void;
  watchTimeMinutes: number;
  episodesWatched: number;
  seriesTracked: number;
  finished: number;
  topGenres: GenreCount[];
};

const canShareFiles = typeof navigator !== "undefined" && typeof navigator.canShare === "function";

export function StatsShareSheet({
  open,
  onClose,
  watchTimeMinutes,
  episodesWatched,
  seriesTracked,
  finished,
  topGenres,
}: StatsShareSheetProps) {
  const { profile } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [background, setBackground] = useState<StatsCardBackground>("dark");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = profile?.username ? `@${profile.username}` : "Episodic";

  useEffect(() => {
    if (!open || !canvasRef.current) {
      return;
    }

    drawStatsCard(canvasRef.current, {
      handle,
      watchTimeMinutes,
      episodesWatched,
      seriesTracked,
      finished,
      topGenres,
      background,
    });
  }, [open, background, handle, watchTimeMinutes, episodesWatched, seriesTracked, finished, topGenres]);

  async function exportCard(action: (file: File, blob: Blob) => Promise<void>) {
    if (!canvasRef.current) {
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const blob = await canvasToBlob(canvasRef.current);
      const file = new File([blob], "episodic-watch-dna.png", { type: "image/png" });
      await action(file, blob);
    } catch (caught) {
      if ((caught as Error)?.name !== "AbortError") {
        setError("Couldn't export the card. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  function download(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "episodic-watch-dna.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleShare() {
    return exportCard(async (file, blob) => {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Watch DNA", text: "My Watch DNA on Episodic" });
      } else {
        download(blob);
      }
    });
  }

  function handleSave() {
    return exportCard(async (_file, blob) => download(blob));
  }

  const backgrounds: { id: StatsCardBackground; label: string }[] = [
    { id: "dark", label: "Midnight" },
    { id: "gradient", label: "Gradient" },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Watch DNA">
      <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-2xl border border-ink-700 bg-ink-950 shadow-xl">
        <canvas ref={canvasRef} className="block h-auto w-full" />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[12px] font-medium text-mist-400">Background</p>
        <div className="flex gap-2">
          {backgrounds.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={background === option.id}
              onClick={() => setBackground(option.id)}
              className={`tap-none min-h-[40px] flex-1 rounded-xl border text-[13px] font-semibold transition-colors ${
                background === option.id
                  ? "border-accent-500 bg-accent-600/15 text-accent-300"
                  : "border-ink-700 bg-ink-850 text-mist-300 active:bg-ink-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-danger-500">
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        {canShareFiles ? (
          <Button fullWidth loading={busy} onClick={handleShare}>
            Share
          </Button>
        ) : (
          <Button fullWidth loading={busy} onClick={handleSave}>
            Save image
          </Button>
        )}
      </div>
    </Sheet>
  );
}
