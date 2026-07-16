import { useId } from "react";
import { MAX_RATING, RATING_STEP } from "@/domain/entities/Review";

function StarIcon({ fill }: { fill: "full" | "half" | "empty" }) {
  const id = useId();

  return (
    <svg viewBox="0 0 24 24" className="size-full" aria-hidden="true">
      {fill === "half" ? (
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      ) : null}
      <path
        d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3-1.1-6.5L.4 9.3l6.5-.9L12 2.5z"
        fill={fill === "empty" ? "transparent" : fill === "half" ? `url(#${id})` : "currentColor"}
        stroke="currentColor"
        strokeWidth="1.5"
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
        return (
          <span key={position} className="size-3.5">
            <StarIcon fill={fill} />
          </span>
        );
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
    <div className="flex items-center gap-3">
      <div className="relative flex items-center gap-1 text-star-500">
        {Array.from({ length: MAX_RATING }, (_, index) => {
          const position = index + 1;
          const fill = value >= position ? "full" : value >= position - 0.5 ? "half" : "empty";
          return (
            <span key={position} className="size-8 pointer-events-none">
              <StarIcon fill={fill} />
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
                onClick={() => onChange(stepValue)}
                className="tap-none h-full flex-1"
              />
            );
          })}
        </div>
      </div>
      <span className="w-8 text-sm font-semibold tabular-nums text-mist-200">
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}
