import { useId } from "react";
import { MAX_RATING, RATING_STEP } from "@/domain/entities/Review";

function StarIcon({ fill, size }: { fill: "full" | "half" | "empty"; size: "sm" | "md" }) {
  const id = useId();
  const px = size === "sm" ? "size-4" : "size-7";

  return (
    <svg viewBox="0 0 24 24" className={px} aria-hidden="true">
      <defs>
        {fill === "half" ? (
          <linearGradient id={id}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.15" />
          </linearGradient>
        ) : null}
        {fill === "full" ? (
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        ) : null}
      </defs>
      <path
        d="M12 1.5l3.09 6.26L22 8.64l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.64l6.91-1.01L12 1.5z"
        fill={
          fill === "empty"
            ? "currentColor"
            : `url(#${id})`
        }
        opacity={fill === "empty" ? 0.12 : 1}
        stroke={fill === "empty" ? "currentColor" : "none"}
        strokeWidth={fill === "empty" ? "1" : "0"}
        strokeOpacity={fill === "empty" ? 0.2 : 0}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RatingDisplay({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 text-star-500 ${className}`} aria-label={`${value} out of 5`}>
      {Array.from({ length: MAX_RATING }, (_, index) => {
        const position = index + 1;
        const fill = value >= position ? "full" : value >= position - 0.5 ? "half" : "empty";
        return <StarIcon key={position} fill={fill} size="sm" />;
      })}
    </div>
  );
}

type RatingInputProps = {
  value: number;
  onChange: (value: number) => void;
};

export function RatingInput({ value, onChange }: RatingInputProps) {
  const steps = MAX_RATING / RATING_STEP;

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex items-center gap-0.5 text-star-500">
        {Array.from({ length: MAX_RATING }, (_, index) => {
          const position = index + 1;
          const fill = value >= position ? "full" : value >= position - 0.5 ? "half" : "empty";
          return (
            <span key={position} className="pointer-events-none">
              <StarIcon fill={fill} size="md" />
            </span>
          );
        })}
        <div className="absolute inset-0 flex">
          {Array.from({ length: steps }, (_, index) => {
            const stepValue = (index + 1) * RATING_STEP;
            return (
              <button
                key={stepValue}
                type="button"
                aria-label={`Rate ${stepValue} out of 5`}
                onClick={() => onChange(stepValue === value ? 0 : stepValue)}
                className="tap-none h-full flex-1"
              />
            );
          })}
        </div>
      </div>
      <span className="min-w-[2rem] text-center text-[15px] font-bold tabular-nums text-mist-200">
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}
