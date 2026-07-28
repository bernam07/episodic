export type WatchProvider = {
  providerId: number;
  providerName: string;
  logoPath: string | null;
  displayPriority: number;
};

export type WatchProviders = {
  region: string;
  link: string | null;
  flatrate: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
};

export function hasProviders(providers: WatchProviders): boolean {
  return providers.flatrate.length > 0 || providers.rent.length > 0 || providers.buy.length > 0;
}

export function preferredRegion(locale: string): string {
  const region = locale.split("-")[1];
  return region && region.length === 2 ? region.toUpperCase() : "PT";
}
