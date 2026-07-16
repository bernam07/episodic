import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
};

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent-600 text-white active:bg-accent-500 disabled:bg-ink-600 disabled:text-mist-500",
  secondary: "bg-ink-700 text-mist-100 active:bg-ink-600 disabled:text-mist-500",
  ghost: "bg-transparent text-mist-300 active:bg-ink-800",
  danger: "bg-transparent text-danger-500 active:bg-ink-800",
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
      className={`tap-none flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors duration-150 ${
        VARIANTS[variant]
      } ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}
