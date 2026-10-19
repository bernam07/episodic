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
      <span className="w-14 shrink-0 text-[0.75rem] font-semibold text-mist-500">
        {label}:
      </span>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {sorted.map((provider) => {
          const logo = providerLogoUrl(provider.logoPath);
          return (
            <div
              key={provider.providerId}
              title={provider.providerName}
              className="flex shrink-0 items-center gap-2 rounded-[8px] border border-white/[0.08] bg-ink-800 px-2.5 py-1.5"
            >
              {logo ? (
                <img src={logo} alt={provider.providerName} loading="lazy" className="size-5 rounded-[4px] object-cover" />
              ) : null}
              <span className="text-[0.75rem] font-semibold text-white">
                {provider.providerName}
              </span>
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
      <section className="mt-6">
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="h-14 w-full rounded-[14px]" />
      </section>
    );
  }

  if (!data || !hasProviders(data)) {
    return null;
  }

  return (
    <section className="mt-6">
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="flex items-baseline gap-2 text-[0.875rem] font-bold tracking-[-0.01em] text-mist-300">
          <span>Available on</span>
          <span className="text-[0.75rem] font-normal text-mist-500">({data.region})</span>
        </h2>
        <span className="text-[0.6875rem] text-mist-500">via JustWatch</span>
      </div>
      <div className="flex flex-col gap-2.5 rounded-[14px] border border-white/[0.08] bg-ink-850 p-3.5">
        <ProviderGroup label="Stream" providers={data.flatrate} />
        <ProviderGroup label="Rent" providers={data.rent} />
        <ProviderGroup label="Buy" providers={data.buy} />
      </div>
    </section>
  );
}
