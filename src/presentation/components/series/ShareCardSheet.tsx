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

type Option =
  | { id: string; kind: "image"; url: string; thumb: string }
  | { id: string; kind: "gradient" | "dark" };

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

  const [selected, setSelected] = useState("poster");
  const [posterImage, setPosterImage] = useState<HTMLImageElement | null>(null);
  const [posterFailed, setPosterFailed] = useState(false);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = profile?.username ? `@${profile.username}` : "Episodic";
  const posterSource = posterUrl(posterPath, "w500");

  const options = useMemo<Option[]>(() => {
    const list: Option[] = [];
    const poster = posterUrl(posterPath, "w500");
    const posterThumb = posterUrl(posterPath, "w154");
    if (poster && posterThumb) {
      list.push({ id: "poster", kind: "image", url: poster, thumb: posterThumb });
    }

    const images = backdrops.length > 0 ? backdrops : backdropPath ? [backdropPath] : [];
    images.forEach((path, index) => {
      const url = backdropUrl(path, "w1280");
      const thumb = backdropUrl(path, "w300");
      if (url && thumb) {
        list.push({ id: `image-${index}`, kind: "image", url, thumb });
      }
    });

    list.push({ id: "gradient", kind: "gradient" });
    list.push({ id: "dark", kind: "dark" });
    return list;
  }, [posterPath, backdropPath, backdrops]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelected(options[0]?.id ?? "gradient");
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
  }, [open, posterSource, options]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const option = options.find((item) => item.id === selected);
    if (!option || option.kind !== "image") {
      setBgImage(null);
      return;
    }

    const cached = cache.current.get(option.url);
    if (cached) {
      setBgImage(cached);
      return;
    }

    if (option.url === posterSource) {
      setBgImage(null);
      return;
    }

    let active = true;
    setBgImage(null);
    loadImage(option.url)
      .then((image) => {
        if (active) {
          cache.current.set(option.url, image);
          setBgImage(image);
        }
      })
      .catch(() => {
        if (active) {
          setSelected("gradient");
        }
      });

    return () => {
      active = false;
    };
  }, [open, selected, options, posterSource, posterImage]);

  useEffect(() => {
    if (!open || !canvasRef.current) {
      return;
    }

    const option = options.find((item) => item.id === selected);
    let background: ShareCardBackground;
    if (option?.kind === "gradient") {
      background = { kind: "gradient" };
    } else if (option?.kind === "dark") {
      background = { kind: "dark" };
    } else if (bgImage) {
      background = { kind: "image", image: bgImage };
    } else {
      background = { kind: "gradient" };
    }

    drawShareCard(canvasRef.current, { poster: posterImage, name, year, rating, handle, background });
  }, [open, selected, options, bgImage, posterImage, name, year, rating, handle]);

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
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {options.map((option) => {
            const active = selected === option.id;
            const ring = active ? "border-accent-500 ring-2 ring-accent-500/40" : "border-ink-700";
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                aria-label={
                  option.kind === "image" ? "Image background" : option.kind === "gradient" ? "Gradient background" : "Midnight background"
                }
                onClick={() => setSelected(option.id)}
                className={`tap-none size-14 shrink-0 overflow-hidden rounded-xl border transition-colors ${ring}`}
              >
                {option.kind === "image" ? (
                  <img src={option.thumb} alt="" className="size-full object-cover" />
                ) : option.kind === "gradient" ? (
                  <span className="block size-full bg-gradient-to-br from-accent-500 via-accent-600 to-ink-950" />
                ) : (
                  <span className="block size-full bg-ink-950" />
                )}
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
