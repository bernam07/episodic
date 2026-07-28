import { useEffect, useMemo, useRef, useState } from "react";
import { backdropUrl, posterUrl } from "@/data/tmdb/images";
import { Button } from "@/presentation/components/ui/Button";
import { Sheet } from "@/presentation/components/ui/Sheet";
import { useAuth } from "@/presentation/hooks/useAuth";
import {
  canvasToBlob,
  drawShareCard,
  loadImage,
  type ShareCardBackground,
} from "@/presentation/utils/shareCard";

type ShareCardSheetProps = {
  open: boolean;
  onClose: () => void;
  posterPath: string | null;
  backdropPath: string | null;
  backdrops: string[];
  name: string;
  year: string | null;
  rating: number | null;
};

type Mode = "image" | "gradient" | "dark";
type ImageCandidate = { id: string; url: string; thumb: string };

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "episodic";
}

const canShareFiles = typeof navigator !== "undefined" && typeof navigator.canShare === "function";

export function ShareCardSheet({
  open,
  onClose,
  posterPath,
  backdropPath,
  backdrops,
  name,
  year,
  rating,
}: ShareCardSheetProps) {
  const { profile } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cache = useRef<Map<string, HTMLImageElement>>(new Map());

  const [mode, setMode] = useState<Mode>("image");
  const [selectedImage, setSelectedImage] = useState("poster");
  const [posterImage, setPosterImage] = useState<HTMLImageElement | null>(null);
  const [posterFailed, setPosterFailed] = useState(false);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = profile?.username ? `@${profile.username}` : "Episodic";
  const posterSource = posterUrl(posterPath, "w500");

  const imageCandidates = useMemo<ImageCandidate[]>(() => {
    const list: ImageCandidate[] = [];
    const poster = posterUrl(posterPath, "w500");
    const posterThumb = posterUrl(posterPath, "w154");
    if (poster && posterThumb) {
      list.push({ id: "poster", url: poster, thumb: posterThumb });
    }

    const paths = backdrops.length > 0 ? backdrops : backdropPath ? [backdropPath] : [];
    paths.forEach((path, index) => {
      const url = backdropUrl(path, "w1280");
      const thumb = backdropUrl(path, "w300");
      if (url && thumb) {
        list.push({ id: `image-${index}`, url, thumb });
      }
    });

    return list;
  }, [posterPath, backdropPath, backdrops]);

  const selectedCandidate = imageCandidates.find((item) => item.id === selectedImage) ?? imageCandidates[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    setMode(imageCandidates.length > 0 ? "image" : "gradient");
    setSelectedImage(imageCandidates[0]?.id ?? "poster");
    setBgImage(null);
    setError(null);
    setPosterImage(null);
    setPosterFailed(false);

    if (!posterSource) {
      setPosterFailed(true);
      return;
    }

    let active = true;
    loadImage(posterSource)
      .then((image) => {
        if (active) {
          cache.current.set(posterSource, image);
          setPosterImage(image);
        }
      })
      .catch(() => {
        if (active) {
          setPosterFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [open, posterSource, imageCandidates]);

  useEffect(() => {
    if (!open || mode !== "image" || !selectedCandidate) {
      return;
    }

    if (selectedCandidate.id === "poster") {
      setBgImage(posterImage);
      return;
    }

    const cached = cache.current.get(selectedCandidate.url);
    if (cached) {
      setBgImage(cached);
      return;
    }

    let active = true;
    setBgImage(null);
    loadImage(selectedCandidate.url)
      .then((image) => {
        if (active) {
          cache.current.set(selectedCandidate.url, image);
          setBgImage(image);
        }
      })
      .catch(() => {
        if (active) {
          setMode("gradient");
        }
      });

    return () => {
      active = false;
    };
  }, [open, mode, selectedCandidate, posterImage]);

  useEffect(() => {
    if (!open || !canvasRef.current) {
      return;
    }

    let background: ShareCardBackground;
    if (mode === "gradient") {
      background = { kind: "gradient" };
    } else if (mode === "dark") {
      background = { kind: "dark" };
    } else if (bgImage) {
      background = { kind: "image", image: bgImage };
    } else {
      background = { kind: "gradient" };
    }

    drawShareCard(canvasRef.current, { poster: posterImage, name, year, rating, handle, background });
  }, [open, mode, bgImage, posterImage, name, year, rating, handle]);

  async function exportCard(action: (file: File, blob: Blob) => Promise<void>) {
    if (!canvasRef.current) {
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const blob = await canvasToBlob(canvasRef.current);
      const file = new File([blob], `${slugify(name)}-episodic.png`, { type: "image/png" });
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
    link.download = `${slugify(name)}-episodic.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleShare() {
    return exportCard(async (file, blob) => {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name, text: `${name} on Episodic` });
      } else {
        download(blob);
      }
    });
  }

  function handleSave() {
    return exportCard(async (_file, blob) => download(blob));
  }

  const modes: { id: Mode; label: string; disabled?: boolean }[] = [
    { id: "image", label: "Poster", disabled: imageCandidates.length === 0 },
    { id: "gradient", label: "Gradient" },
    { id: "dark", label: "Midnight" },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Share card">
      <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-2xl border border-ink-700 bg-ink-950 shadow-xl">
        <canvas ref={canvasRef} className="block h-auto w-full" />
      </div>

      {posterFailed ? (
        <p className="mt-3 text-center text-[12px] text-mist-500">
          Poster couldn't be loaded — pick another background.
        </p>
      ) : null}

      <div className="mt-5">
        <p className="mb-2 text-[12px] font-medium text-mist-400">Background</p>
        <div className="flex gap-2">
          {modes.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={option.disabled}
              aria-pressed={mode === option.id}
              onClick={() => setMode(option.id)}
              className={`tap-none min-h-[40px] flex-1 rounded-xl border text-[13px] font-semibold transition-colors disabled:opacity-40 ${
                mode === option.id
                  ? "border-accent-500 bg-accent-600/15 text-accent-300"
                  : "border-ink-700 bg-ink-850 text-mist-300 active:bg-ink-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "image" && imageCandidates.length > 1 ? (
        <div className="mt-3">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {imageCandidates.map((candidate) => {
              const active = selectedCandidate?.id === candidate.id;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  aria-pressed={active}
                  aria-label={candidate.id === "poster" ? "Poster image" : "Backdrop image"}
                  onClick={() => setSelectedImage(candidate.id)}
                  className={`tap-none h-14 w-20 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                    active ? "border-accent-500 ring-2 ring-accent-500/40" : "border-ink-700"
                  }`}
                >
                  <img src={candidate.thumb} alt="" className="size-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

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
