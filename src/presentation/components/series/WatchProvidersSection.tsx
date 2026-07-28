import { providerLogoUrl } from "@/data/tmdb/images";
import { hasProviders, type WatchProvider } from "@/domain/entities/WatchProviders";
import { Skeleton } from "@/presentation/components/ui/Skeleton";
import { useWatchProviders } from "@/presentation/hooks/useDiscovery";

function ProviderGroup({ label, providers }: { label: string; providers: WatchProvider[] }) {
  if (providers.length === 0) {
    return null;
  }

  const sorted = [...providers].sort((a, b) => a.displayPriority - b.displayPriority).slice(0, 8);

  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-[11px] font-medium tracking-wide text-mist-500 uppercase">
        {label}
      </span>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {sorted.map((provider) => {
          const logo = providerLogoUrl(provider.logoPath);
          return (
            <div
              key={provider.providerId}
              title={provider.providerName}
              className="size-10 shrink-0 overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/10"
            >
              {logo ? (
                <img src={logo} alt={provider.providerName} loading="lazy" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-[9px] text-mist-500">
                  {provider.providerName.slice(0, 3)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WatchProvidersSection({ tmdbId }: { tmdbId: number }) {
  const { data, isLoading } = useWatchProviders(tmdbId);

  if (isLoading) {
    return (
      <section className="mt-7">
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="h-16 w-full rounded-card" />
      </section>
    );
  }

  if (!data || !hasProviders(data)) {
    return null;
  }

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
          Where to Watch
          <span className="ml-1.5 text-mist-600">{data.region}</span>
        </h2>
        <span className="text-[10px] text-mist-600">via JustWatch</span>
      </div>
      <div className="flex flex-col gap-3 rounded-card bg-ink-850 p-4">
        <ProviderGroup label="Stream" providers={data.flatrate} />
        <ProviderGroup label="Rent" providers={data.rent} />
        <ProviderGroup label="Buy" providers={data.buy} />
      </div>
    </section>
  );
}
