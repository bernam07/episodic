export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-ink-800 ${className}`} />;
}

export function PosterSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="aspect-2/3 w-full rounded-card" />
      <Skeleton className="mt-2 h-3 w-3/4" />
    </div>
  );
}

export function PosterGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {Array.from({ length: count }, (_, index) => (
        <PosterSkeleton key={index} />
      ))}
    </div>
  );
}

export function RailSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
      {Array.from({ length: count }, (_, index) => (
        <PosterSkeleton key={index} className="w-[132px] shrink-0" />
      ))}
    </div>
  );
}

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4 px-5 py-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-start gap-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 pt-1">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
          <Skeleton className="h-[72px] w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}
