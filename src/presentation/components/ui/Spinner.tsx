export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block size-6 animate-spin rounded-full border-2 border-ink-600 border-t-accent-500 ${className}`}
    />
  );
}

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <Spinner />
    </div>
  );
}
