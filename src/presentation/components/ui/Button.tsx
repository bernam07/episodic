import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-accent-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-accent-600/30 border border-white/20 hover:shadow-accent-600/40 hover:brightness-110 active:scale-[0.98] disabled:bg-none disabled:bg-ink-700 disabled:text-mist-500 disabled:shadow-none disabled:border-transparent",
  secondary:
    "bg-ink-850/90 text-mist-100 border border-white/10 backdrop-blur-md hover:bg-ink-800 hover:border-white/20 active:scale-[0.98] disabled:text-mist-500",
  ghost:
    "bg-transparent text-mist-300 hover:bg-white/[0.06] hover:text-white active:scale-[0.98] disabled:text-mist-600",
  danger:
    "bg-danger-500/15 text-danger-500 border border-danger-500/30 hover:bg-danger-500/25 active:scale-[0.98] disabled:text-mist-500",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`tap-none flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-semibold transition-all duration-200 ${
        VARIANTS[variant]
      } ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}
