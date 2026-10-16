import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

type ToastType = "info" | "success" | "error";

type ToastMessage = {
  id: number;
  text: string;
  type: ToastType;
};

type ToastContextValue = {
  show: (text: string, type?: ToastType) => void;
  success: (text: string) => void;
  error: (text: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastSeq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((text: string, type: ToastType = "info") => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev.slice(-2), { id, text, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const success = useCallback((text: string) => show(text, "success"), [show]);
  const error = useCallback((text: string) => show(text, "error"), [show]);

  const value = useMemo(() => ({ show, success, error }), [show, success, error]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4 pt-safe"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="ios-material-thick pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/[0.12] px-4 py-2.5 shadow-2xl transition-all duration-200"
          >
            {toast.type === "success" ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#30d158] text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="size-3">
                  <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            ) : toast.type === "error" ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-danger-500 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="size-3">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            ) : (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white">
                <span className="size-1.5 rounded-full bg-current" />
              </span>
            )}
            <span className="text-[0.875rem] font-semibold tracking-[-0.01em] text-white">{toast.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
