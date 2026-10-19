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
    "bg-accent-500 text-white shadow-[0_4px_14px_rgba(239,51,64,0.28)] hover:bg-accent-400 active:opacity-85 disabled:bg-ink-800 disabled:text-mist-500 disabled:shadow-none",
  secondary:
    "border border-white/[0.08] bg-ink-800 text-white hover:bg-ink-700 active:opacity-80 disabled:text-mist-500",
  ghost:
    "bg-transparent text-mist-200 hover:bg-white/[0.06] hover:text-white active:opacity-70 disabled:text-mist-600",
  danger:
    "border border-danger-500/25 bg-danger-500/15 text-danger-500 hover:bg-danger-500/25 active:opacity-80 disabled:text-mist-500",
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
      className={`tap-none flex min-h-[46px] items-center justify-center gap-2 rounded-[12px] px-5 text-[0.9375rem] font-semibold tracking-[-0.01em] transition-all duration-150 ${
        VARIANTS[variant]
      } ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}
