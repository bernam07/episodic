import { useId } from "react";

type BrandMarkSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<BrandMarkSize, string> = {
  sm: "size-7 rounded-[8px]",
  md: "size-8.5 rounded-[10px]",
  lg: "size-11 rounded-[13px]",
};

export function BrandMark({
  size = "md",
  className = "",
}: {
  size?: BrandMarkSize;
  className?: string;
}) {
  const uid = useId();
  const bgId = `ep-bg-${uid}`;
  const auraId = `ep-aura-${uid}`;
  const rimId = `ep-rim-${uid}`;
  const cardId = `ep-card-${uid}`;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.55)] ${SIZE_CLASSES[size]} ${className}`.trim()}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" fill="none" className="size-full">
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1c1c24" />
            <stop offset="55%" stopColor="#111116" />
            <stop offset="100%" stopColor="#09090c" />
          </linearGradient>
          <radialGradient
            id={auraId}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(46 18) rotate(135) scale(36)"
          >
            <stop offset="0%" stopColor="#ef3340" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#ef3340" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={rimId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ef3340" stopOpacity="0.32" />
          </linearGradient>
          <linearGradient id={cardId} x1="22" y1="11" x2="52" y2="41" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff4754" />
            <stop offset="100%" stopColor="#d90b1c" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill={`url(#${bgId})`} />
        <rect width="64" height="64" rx="16" fill={`url(#${auraId})`} />
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="15"
          stroke={`url(#${rimId})`}
          strokeWidth="1.5"
        />
        <rect
          x="23"
          y="12"
          width="29"
          height="29"
          rx="8"
          fill={`url(#${cardId})`}
        />
        <rect
          x="12"
          y="23"
          width="29"
          height="29"
          rx="8"
          fill="#ffffff"
        />
        <path
          d="M23.2 32.1C23.2 30.88 24.54 30.14 25.58 30.78L33.24 35.5C34.22 36.1 34.22 37.52 33.24 38.12L25.58 42.84C24.54 43.48 23.2 42.74 23.2 41.52V32.1Z"
          fill="#ef3340"
        />
      </svg>
    </span>
  );
}
