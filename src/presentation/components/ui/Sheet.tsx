import { useEffect, type ReactNode } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="ios-material-thick pb-safe relative flex max-h-[90dvh] w-full max-w-screen-sm flex-col rounded-t-[20px] border-t border-white/[0.12] shadow-[0_-10px_40px_rgba(0,0,0,0.65)] md:max-w-md md:rounded-[20px] md:border md:border-white/[0.12] md:shadow-2xl"
      >
        <div className="flex shrink-0 justify-center pt-2.5 pb-1 md:hidden">
          <span className="h-[5px] w-9 rounded-full bg-white/25" />
        </div>
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-5 pt-2.5 pb-3.5">
          <h2 className="text-[1.0625rem] font-semibold tracking-[-0.015em] text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="tap-none -mr-1 flex size-[30px] items-center justify-center rounded-full bg-ink-700/80 text-mist-300 transition-opacity active:opacity-70 hover:bg-ink-600 hover:text-white"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
