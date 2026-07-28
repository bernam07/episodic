export type ShareCardBackground = "poster" | "gradient" | "dark";

export const SHARE_CARD_BACKGROUNDS: { id: ShareCardBackground; label: string }[] = [
  { id: "poster", label: "Poster" },
  { id: "gradient", label: "Gradient" },
  { id: "dark", label: "Midnight" },
];

export type ShareCardInput = {
  poster: HTMLImageElement | null;
  name: string;
  year: string | null;
  rating: number | null;
  handle: string;
  background: ShareCardBackground;
};

const WIDTH = 1080;
const HEIGHT = 1350;
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

const INK_950 = "#060b16";
const INK_800 = "#111b2f";
const MIST_100 = "#e8edf7";
const MIST_400 = "#7c8db0";
const ACCENT = "#3b82f6";
const STAR = "#fbbf24";

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image_load_failed"));
    image.src = url;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("canvas_export_failed"));
      }
    }, "image/png");
  });
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number) {
  const inner = outer * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function drawStars(ctx: CanvasRenderingContext2D, centerX: number, y: number, rating: number) {
  const size = 34;
  const gap = 82;
  const total = 5;
  const startX = centerX - ((total - 1) * gap) / 2;

  for (let i = 0; i < total; i += 1) {
    const cx = startX + i * gap;
    const fill = Math.max(0, Math.min(1, rating - i));

    ctx.save();
    starPath(ctx, cx, y, size);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fill();
    ctx.restore();

    if (fill > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - size, y - size, size * 2 * fill, size * 2);
      ctx.clip();
      starPath(ctx, cx, y, size);
      ctx.fillStyle = STAR;
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (let i = 0; i < words.length; i += 1) {
    const candidate = current ? `${current} ${words[i]}` : words[i];

    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = words[i];

      if (lines.length === maxLines - 1) {
        const full = words.slice(i).join(" ");
        let rest = full;
        while (rest.includes(" ") && ctx.measureText(`${rest}…`).width > maxWidth) {
          rest = rest.slice(0, rest.lastIndexOf(" "));
        }
        while (rest && ctx.measureText(`${rest}…`).width > maxWidth) {
          rest = rest.slice(0, -1);
        }
        lines.push(rest === full ? rest : `${rest.trimEnd()}…`);
        return lines;
      }
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

export function drawShareCard(canvas: HTMLCanvasElement, input: ShareCardInput) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (input.background === "poster" && input.poster) {
    ctx.save();
    ctx.filter = "blur(60px)";
    drawCover(ctx, input.poster, WIDTH, HEIGHT);
    ctx.restore();
    ctx.fillStyle = "rgba(6,11,22,0.72)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else if (input.background === "gradient") {
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, ACCENT);
    gradient.addColorStop(0.55, "#12224a");
    gradient.addColorStop(1, INK_950);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = INK_950;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const glow = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.34, 80, WIDTH / 2, HEIGHT * 0.34, 760);
    glow.addColorStop(0, "rgba(37,99,235,0.28)");
    glow.addColorStop(1, "rgba(6,11,22,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  const posterW = 520;
  const posterH = 780;
  const posterX = (WIDTH - posterW) / 2;
  const posterY = 88;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 28;
  roundedRect(ctx, posterX, posterY, posterW, posterH, 28);
  ctx.fillStyle = INK_800;
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRect(ctx, posterX, posterY, posterW, posterH, 28);
  ctx.clip();
  ctx.translate(posterX, posterY);
  if (input.poster) {
    drawCover(ctx, input.poster, posterW, posterH);
  } else {
    ctx.fillStyle = INK_800;
    ctx.fillRect(0, 0, posterW, posterH);
    ctx.fillStyle = MIST_400;
    ctx.font = `700 220px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((input.name[0] ?? "?").toUpperCase(), posterW / 2, posterH / 2);
  }
  ctx.restore();

  const contentTop = posterY + posterH + 82;
  const lineHeight = 64;

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 56px ${FONT}`;
  ctx.fillStyle = MIST_100;
  const lines = wrapLines(ctx, input.name, WIDTH - 170, 2);
  lines.forEach((line, index) => {
    ctx.fillText(line, WIDTH / 2, contentTop + index * lineHeight);
  });

  const lastBaseline = contentTop + Math.max(lines.length - 1, 0) * lineHeight;

  if (input.year) {
    ctx.font = `500 34px ${FONT}`;
    ctx.fillStyle = MIST_400;
    ctx.fillText(input.year, WIDTH / 2, lastBaseline + 46);
  }

  const starsY = lastBaseline + (input.year ? 112 : 82);
  if (input.rating && input.rating > 0) {
    drawStars(ctx, WIDTH / 2, starsY, input.rating);
  }

  const footerY = HEIGHT - 86;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, footerY - 54);
  ctx.lineTo(WIDTH - 120, footerY - 54);
  ctx.stroke();
  ctx.restore();

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `600 36px ${FONT}`;
  ctx.fillStyle = MIST_400;
  ctx.fillText(input.handle, 120, footerY);

  ctx.textAlign = "right";
  ctx.font = `800 36px ${FONT}`;
  ctx.fillStyle = MIST_100;
  ctx.fillText("EPISODIC", WIDTH - 158, footerY);
  ctx.beginPath();
  ctx.arc(WIDTH - 132, footerY, 12, 0, Math.PI * 2);
  ctx.fillStyle = ACCENT;
  ctx.fill();
}
