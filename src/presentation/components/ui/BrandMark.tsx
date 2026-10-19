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
  const bgId = `episodic-bg-${uid}`;
  const glowId = `episodic-glow-${uid}`;
  const rimId = `episodic-rim-${uid}`;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden shadow-[0_4px_14px_rgba(229,9,20,0.38)] ${SIZE_CLASSES[size]} ${className}`.trim()}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" fill="none" className="size-full">
        <defs>
          <linearGradient id={bgId} x1="6" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff384f" />
            <stop offset="48%" stopColor="#e50914" />
            <stop offset="100%" stopColor="#99040c" />
          </linearGradient>
          <radialGradient
            id={glowId}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(18 12) rotate(45) scale(38)"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={rimId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.36" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill={`url(#${bgId})`} />
        <rect width="64" height="64" rx="16" fill={`url(#${glowId})`} />
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="15"
           stroke={`url(#${rimId})`}
          strokeWidth="1.5"
        />
        <rect x="14" y="17" width="14" height="6.5" rx="3.25" fill="#ffffff" />
        <rect x="14" y="28.75" width="10.5" height="6.5" rx="3.25" fill="#ffffff" fillOpacity="0.92" />
        <rect x="14" y="40.5" width="14" height="6.5" rx="3.25" fill="#ffffff" />
        <path
          d="M31.5 20.4C31.5 18.52 33.56 17.37 35.16 18.36L49.68 29.46C51.14 30.56 51.14 33.44 49.68 34.54L35.16 45.64C33.56 46.63 31.5 45.48 31.5 43.6V20.4Z"
          fill="#ffffff"
        />
      </svg>
    </span>
  );
}
