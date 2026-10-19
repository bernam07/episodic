export type ShareCardBackground =
  | { kind: "image"; image: HTMLImageElement }
  | { kind: "gradient" }
  | { kind: "dark" };

export type ShareCardInput = {
  poster: HTMLImageElement | null;
  name: string;
  year: string | null;
  rating: number | null;
  handle: string;
  background: ShareCardBackground;
};

const WIDTH = 1080;
const HEIGHT = 1920;
const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

const INK_950 = "#0b0b0d";
const INK_900 = "#121216";
const INK_850 = "#16161b";
const WHITE = "#ffffff";
const MIST_300 = "#c4c4cc";
const MIST_400 = "#8e8e98";
const MIST_500 = "#63636c";
const ACCENT = "#ef3340";
const ACCENT_LIGHT = "#ff646c";
const STAR = "#f5b50a";

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
  const inner = outer * 0.44;
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
    ctx.fillStyle = "rgba(255,255,255,0.14)";
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

function drawLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const x = cx - size / 2;
  const y = cy - size / 2;
  const s = size / 64;

  ctx.save();
  roundedRect(ctx, x, y, size, size, 16 * s);
  const bg = ctx.createLinearGradient(x, y, x + size, y + size);
  bg.addColorStop(0, "#1c1c24");
  bg.addColorStop(1, "#09090c");
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2 * s;
  ctx.stroke();

  roundedRect(ctx, x + 23 * s, y + 12 * s, 29 * s, 29 * s, 8 * s);
  ctx.fillStyle = ACCENT;
  ctx.fill();

  roundedRect(ctx, x + 12 * s, y + 23 * s, 29 * s, 29 * s, 8 * s);
  ctx.fillStyle = WHITE;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 23.5 * s, y + 31.2 * s);
  ctx.lineTo(x + 33.4 * s, y + 36.8 * s);
  ctx.lineTo(x + 23.5 * s, y + 42.4 * s);
  ctx.closePath();
  ctx.fillStyle = ACCENT;
  ctx.fill();
  ctx.restore();
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

function drawBrandFooter(ctx: CanvasRenderingContext2D, handle: string) {
  const footerY = HEIGHT - 116;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, footerY - 70);
  ctx.lineTo(WIDTH - 100, footerY - 70);
  ctx.stroke();
  ctx.restore();

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `600 38px ${FONT}`;
  ctx.fillStyle = MIST_300;
  ctx.fillText(handle, 100, footerY);

  ctx.textAlign = "right";
  ctx.font = `800 40px ${FONT}`;
  ctx.fillStyle = WHITE;
  ctx.fillText("Episodic", WIDTH - 100, footerY);
  const wordmarkWidth = ctx.measureText("Episodic").width;
  drawLogo(ctx, WIDTH - 100 - wordmarkWidth - 42, footerY, 54);
}

export function drawShareCard(canvas: HTMLCanvasElement, input: ShareCardInput) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (input.background.kind === "image") {
    ctx.save();
    ctx.filter = "blur(56px)";
    drawCover(ctx, input.background.image, WIDTH, HEIGHT);
    ctx.restore();
    const shade = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    shade.addColorStop(0, "rgba(11,11,13,0.58)");
    shade.addColorStop(0.5, "rgba(11,11,13,0.72)");
    shade.addColorStop(1, "rgba(11,11,13,0.96)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else if (input.background.kind === "gradient") {
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, "#470a12");
    gradient.addColorStop(0.45, "#19090d");
    gradient.addColorStop(1, INK_950);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const radial = ctx.createRadialGradient(WIDTH * 0.5, HEIGHT * 0.25, 80, WIDTH * 0.5, HEIGHT * 0.25, 860);
    radial.addColorStop(0, "rgba(239,51,64,0.28)");
    radial.addColorStop(1, "rgba(11,11,13,0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = INK_950;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const glow = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.34, 100, WIDTH / 2, HEIGHT * 0.34, 920);
    glow.addColorStop(0, "rgba(239,51,64,0.22)");
    glow.addColorStop(1, "rgba(11,11,13,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  const posterW = 620;
  const posterH = 930;
  const posterX = (WIDTH - posterW) / 2;
  const posterY = 210;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 80;
  ctx.shadowOffsetY = 38;
  roundedRect(ctx, posterX, posterY, posterW, posterH, 36);
  ctx.fillStyle = INK_850;
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRect(ctx, posterX, posterY, posterW, posterH, 36);
  ctx.clip();
  ctx.translate(posterX, posterY);
  if (input.poster) {
    drawCover(ctx, input.poster, posterW, posterH);
  } else {
    ctx.fillStyle = INK_850;
    ctx.fillRect(0, 0, posterW, posterH);
    ctx.fillStyle = MIST_400;
    ctx.font = `800 220px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((input.name[0] ?? "?").toUpperCase(), posterW / 2, posterH / 2);
  }
  ctx.restore();

  ctx.save();
  roundedRect(ctx, posterX, posterY, posterW, posterH, 36);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  const contentTop = posterY + posterH + 118;
  const lineHeight = 82;

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 66px ${FONT}`;
  ctx.fillStyle = WHITE;
  const lines = wrapLines(ctx, input.name, WIDTH - 180, 2);
  lines.forEach((line, index) => {
    ctx.fillText(line, WIDTH / 2, contentTop + index * lineHeight);
  });

  const lastBaseline = contentTop + Math.max(lines.length - 1, 0) * lineHeight;

  if (input.year) {
    ctx.font = `600 36px ${FONT}`;
    ctx.fillStyle = MIST_400;
    ctx.fillText(input.year, WIDTH / 2, lastBaseline + 56);
  }

  const starsY = lastBaseline + (input.year ? 132 : 92);
  if (input.rating && input.rating > 0) {
    drawStars(ctx, WIDTH / 2, starsY, input.rating);
    ctx.font = `800 34px ${FONT}`;
    ctx.fillStyle = STAR;
    ctx.fillText(`${input.rating.toFixed(1)} / 5.0`, WIDTH / 2, starsY + 74);
  }

  drawBrandFooter(ctx, input.handle);
}

export type StatsCardBackground = "gradient" | "dark";

export type StatsCardInput = {
  handle: string;
  watchTimeMinutes: number;
  episodesWatched: number;
  seriesTracked: number;
  finished: number;
  topGenres: { genre: string; count: number }[];
  background: StatsCardBackground;
};

function formatHours(minutes: number): string {
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest ? `${days}d ${rest}h` : `${days}d`;
}

const GENRE_PALETTE = ["#ef3340", "#3b82f6", "#f59e0b", "#10b981"];

export function drawStatsCard(canvas: HTMLCanvasElement, input: StatsCardInput) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (input.background === "gradient") {
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, "#420910");
    gradient.addColorStop(0.5, "#16090d");
    gradient.addColorStop(1, INK_950);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = INK_950;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const glow = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.24, 100, WIDTH / 2, HEIGHT * 0.24, 920);
    glow.addColorStop(0, "rgba(239,51,64,0.22)");
    glow.addColorStop(1, "rgba(11,11,13,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = `700 28px ${FONT}`;
  ctx.fillStyle = ACCENT_LIGHT;
  ctx.fillText("TASTE PROFILE & STATS", 100, 175);

  ctx.font = `800 76px ${FONT}`;
  ctx.fillStyle = WHITE;
  ctx.fillText("Watch DNA", 100, 260);

  roundedRect(ctx, 100, 320, WIDTH - 200, 480, 40);
  ctx.fillStyle = "rgba(22,22,27,0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = MIST_400;
  ctx.fillText("TOTAL TIME WATCHED", 156, 400);

  ctx.font = `800 148px ${FONT}`;
  ctx.fillStyle = WHITE;
  ctx.fillText(formatHours(input.watchTimeMinutes), 156, 555);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(156, 616);
  ctx.lineTo(WIDTH - 156, 616);
  ctx.stroke();
  ctx.restore();

  const tiles: [number, string][] = [
    [input.episodesWatched, "Episodes"],
    [input.seriesTracked, "Series"],
    [input.finished, "Finished"],
  ];
  const innerW = WIDTH - 312;
  const colW = innerW / 3;
  tiles.forEach(([value, label], index) => {
    const colX = 156 + colW * index;
    ctx.font = `800 58px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.fillText(String(value), colX, 695);
    ctx.font = `600 28px ${FONT}`;
    ctx.fillStyle = MIST_500;
    ctx.fillText(label, colX, 740);
  });

  const genres = input.topGenres.slice(0, 4);
  if (genres.length > 0) {
    const cardTop = 850;
    const cardH = 140 + genres.length * 145;
    roundedRect(ctx, 100, cardTop, WIDTH - 200, cardH, 40);
    ctx.fillStyle = "rgba(22,22,27,0.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `700 26px ${FONT}`;
    ctx.fillStyle = MIST_400;
    ctx.fillText("TOP GENRES", 156, cardTop + 76);

    const max = genres[0].count || 1;
    genres.forEach((entry, index) => {
      const rowY = cardTop + 155 + index * 135;
      const pct = Math.min(Math.round((entry.count / max) * 100), 100);
      const barColor = GENRE_PALETTE[index % GENRE_PALETTE.length];

      ctx.textAlign = "left";
      ctx.font = `700 38px ${FONT}`;
      ctx.fillStyle = WHITE;
      ctx.fillText(entry.genre, 156, rowY);

      ctx.textAlign = "right";
      ctx.font = `800 34px ${FONT}`;
      ctx.fillStyle = MIST_300;
      ctx.fillText(`${pct}%`, WIDTH - 156, rowY);

      const trackY = rowY + 24;
      const trackW = WIDTH - 312;
      roundedRect(ctx, 156, trackY, trackW, 16, 8);
      ctx.fillStyle = INK_900;
      ctx.fill();

      roundedRect(ctx, 156, trackY, Math.max((entry.count / max) * trackW, 20), 16, 8);
      ctx.fillStyle = barColor;
      ctx.fill();
    });
  }

  drawBrandFooter(ctx, input.handle);
}
