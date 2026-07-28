import { useEffect, useRef, useState } from "react";
import { posterUrl } from "@/data/tmdb/images";
import { Button } from "@/presentation/components/ui/Button";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { useAuth } from "@/presentation/hooks/useAuth";
import {
  SHARE_CARD_BACKGROUNDS,
  canvasToBlob,
  drawShareCard,
  loadImage,
  type ShareCardBackground,
} from "@/presentation/utils/shareCard";

type ShareCardSheetProps = {
  open: boolean;
  onClose: () => void;
  posterPath: string | null;
  name: string;
  year: string | null;
  rating: number | null;
};

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "episodic";
}

export function ShareCardSheet({ open, onClose, posterPath, name, year, rating }: ShareCardSheetProps) {
  const { profile } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poster, setPoster] = useState<HTMLImageElement | null>(null);
  const [posterFailed, setPosterFailed] = useState(false);
  const [background, setBackground] = useState<ShareCardBackground>("poster");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = profile?.username ? `@${profile.username}` : "Episodic";

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setError(null);
    setPoster(null);
    setPosterFailed(false);

    const url = posterUrl(posterPath, "w500");
    if (!url) {
      setPosterFailed(true);
      return;
    }

    loadImage(url)
      .then((image) => {
        if (active) {
          setPoster(image);
        }
      })
      .catch(() => {
        if (active) {
          setPosterFailed(true);
          setBackground((current) => (current === "poster" ? "gradient" : current));
        }
      });

    return () => {
      active = false;
    };
  }, [open, posterPath]);

  useEffect(() => {
    if (!open || !canvasRef.current) {
      return;
    }

    drawShareCard(canvasRef.current, { poster, name, year, rating, handle, background });
  }, [open, poster, name, year, rating, handle, background]);

  async function withCanvas(action: (blob: Blob, file: File) => Promise<void>) {
    if (!canvasRef.current) {
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const blob = await canvasToBlob(canvasRef.current);
      const file = new File([blob], `${slugify(name)}-episodic.png`, { type: "image/png" });
      await action(blob, file);
    } catch (caught) {
      if ((caught as Error)?.name !== "AbortError") {
        setError("Couldn't export the card. Try saving it instead.");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleShare() {
    return withCanvas(async (_blob, file) => {
      const shareData = { files: [file], title: name, text: `${name} on Episodic` };

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share(shareData);
      } else {
        handleSave();
      }
    });
  }

  function handleSave() {
    return withCanvas(async (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slugify(name)}-episodic.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  const canShareFiles =
    typeof navigator !== "undefined" && typeof navigator.canShare === "function";

  return (
    <Sheet open={open} onClose={onClose} title="Share card">
      <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl border border-ink-700 bg-ink-950 shadow-xl">
        <canvas ref={canvasRef} className="block h-auto w-full" />
      </div>

      {posterFailed ? (
        <p className="mt-3 text-center text-[12px] text-mist-500">
          Poster couldn't be loaded — using a coloured background.
        </p>
      ) : null}

      <div className="mt-5">
        <p className="mb-2 text-[12px] font-medium text-mist-400">Background</p>
        <div className="flex gap-2">
          {SHARE_CARD_BACKGROUNDS.map((option) => {
            const disabled = option.id === "poster" && posterFailed;
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                aria-pressed={background === option.id}
                onClick={() => setBackground(option.id)}
                className={`tap-none min-h-[40px] flex-1 rounded-xl border text-[13px] font-semibold transition-colors disabled:opacity-40 ${
                  background === option.id
                    ? "border-accent-500 bg-accent-600/15 text-accent-300"
                    : "border-ink-700 bg-ink-850 text-mist-300 active:bg-ink-800"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-danger-500">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex gap-2">
        {canShareFiles ? (
          <Button fullWidth loading={busy} onClick={handleShare}>
            Share
          </Button>
        ) : null}
        <Button variant={canShareFiles ? "secondary" : "primary"} fullWidth loading={busy} onClick={handleSave}>
          Save image
        </Button>
      </div>
    </Sheet>
  );
}
