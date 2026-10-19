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
    { id: "dark", label: "Carbon" },
    { id: "gradient", label: "Cinema Glow" },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Watch DNA">
      <div className="flex justify-center pt-3 pb-2">
        <canvas
          ref={canvasRef}
          className="aspect-9/16 max-h-[380px] w-auto rounded-[16px] ring-1 ring-white/15 shadow-2xl"
        />
      </div>

      <div className="mt-4 flex rounded-[10px] border border-white/[0.08] bg-ink-850 p-1">
        {backgrounds.map((option) => {
          const active = background === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => setBackground(option.id)}
              className={`tap-none min-h-[34px] flex-1 rounded-[8px] text-[0.8125rem] font-semibold transition-all duration-150 ${
                active
                  ? "bg-ink-700 text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                  : "text-mist-400 hover:text-mist-200"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-[0.8125rem] text-danger-500">
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
