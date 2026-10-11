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

function ShareCardContent({
  posterPath,
  backdropPath,
  backdrops,
  name,
  year,
  rating,
}: Omit<ShareCardSheetProps, "open" | "onClose">) {
  const { profile } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cache = useRef<Map<string, HTMLImageElement>>(new Map());

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

  const [mode, setMode] = useState<Mode>(() => (imageCandidates.length > 0 ? "image" : "gradient"));
  const [selectedImage, setSelectedImage] = useState(() => imageCandidates[0]?.id ?? "poster");
  const [posterImage, setPosterImage] = useState<HTMLImageElement | null>(null);
  const [posterLoadFailed, setPosterLoadFailed] = useState(false);
  const [remoteBgImage, setRemoteBgImage] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = profile?.username ? `@${profile.username}` : "Episodic";
  const selectedCandidate = imageCandidates.find((item) => item.id === selectedImage) ?? imageCandidates[0];
  const bgImage = selectedCandidate?.id === "poster" ? posterImage : remoteBgImage;
  const posterFailed = !posterSource || posterLoadFailed;

  useEffect(() => {
    if (!posterSource) {
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
          setPosterLoadFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [posterSource]);

  useEffect(() => {
    if (mode !== "image" || !selectedCandidate || selectedCandidate.id === "poster") {
      return;
    }

    const cached = cache.current.get(selectedCandidate.url);
    if (cached) {
      setRemoteBgImage(cached);
      return;
    }

    let active = true;
    loadImage(selectedCandidate.url)
      .then((image) => {
        if (active) {
          cache.current.set(selectedCandidate.url, image);
          setRemoteBgImage(image);
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
  }, [mode, selectedCandidate]);

  useEffect(() => {
    if (!canvasRef.current) {
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
  }, [mode, bgImage, posterImage, name, year, rating, handle]);

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

  async function handleShare() {
    await exportCard(async (file, blob) => {
      if (canShareFiles && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${name} on Episodic`,
          });
          return;
        } catch (caught) {
          if ((caught as Error)?.name === "AbortError") {
            return;
          }
        }
      }
      download(blob);
    });
  }

  async function handleSave() {
    await exportCard(async (_file, blob) => {
      download(blob);
    });
  }

  return (
    <>
      <div className="flex justify-center py-2">
        <canvas
          ref={canvasRef}
          className="aspect-9/16 max-h-[380px] w-auto rounded-2xl border border-white/10 shadow-2xl"
        />
      </div>

      {posterFailed ? (
        <p className="mt-2 text-center text-[12px] text-mist-500">
          Poster couldn't be loaded into the share card.
        </p>
      ) : null}

      <div className="mt-4 flex rounded-xl border border-ink-700 bg-ink-850 p-1">
        {(
          [
            { id: "image", label: "Photo" },
            { id: "gradient", label: "Gradient" },
            { id: "dark", label: "Dark" },
          ] as const
        ).map((tab) => {
          const active = mode === tab.id;
          const disabled = tab.id === "image" && imageCandidates.length === 0;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => setMode(tab.id)}
              className={`tap-none min-h-[34px] flex-1 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-40 ${
                active ? "bg-accent-600 text-white" : "text-mist-400 active:text-mist-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {mode === "image" && imageCandidates.length > 1 ? (
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-medium text-mist-400">Background photo</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {imageCandidates.map((candidate) => {
              const active = candidate.id === selectedImage;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  aria-label={candidate.id === "poster" ? "Use poster as background" : `Use photo ${candidate.id} as background`}
                  onClick={() => setSelectedImage(candidate.id)}
                  className={`tap-none relative aspect-16/10 h-14 shrink-0 overflow-hidden rounded-lg border transition-all ${
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
    </>
  );
}

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
  return (
    <Sheet open={open} onClose={onClose} title="Share card">
      {open ? (
        <ShareCardContent
          posterPath={posterPath}
          backdropPath={backdropPath}
          backdrops={backdrops}
          name={name}
          year={year}
          rating={rating}
        />
      ) : null}
    </Sheet>
  );
}
