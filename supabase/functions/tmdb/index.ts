const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_ACCESS_TOKEN = Deno.env.get("TMDB_ACCESS_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

type TmdbSeasonSummary = {
  season_number: number;
  episode_count: number;
  name: string;
  air_date: string | null;
  poster_path: string | null;
};

type TmdbGenre = { id: number; name: string };

type TmdbEpisodeStub = {
  id: number;
  season_number: number;
  episode_number: number;
  name: string;
  air_date: string | null;
};

function json(body: unknown, status = 200, cacheSeconds = 0): Response {
  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };

  if (cacheSeconds > 0) {
    headers["Cache-Control"] = `public, max-age=${cacheSeconds}, stale-while-revalidate=86400`;
  }

  return new Response(JSON.stringify(body), { status, headers });
}

const IS_V4_TOKEN = (TMDB_ACCESS_TOKEN ?? "").includes(".");

async function tmdbFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("language", "en-US");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const headers: Record<string, string> = { Accept: "application/json" };

  if (IS_V4_TOKEN) {
    headers.Authorization = `Bearer ${TMDB_ACCESS_TOKEN}`;
  } else {
    url.searchParams.set("api_key", TMDB_ACCESS_TOKEN as string);
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`tmdb_error_${response.status}`);
  }

  return response.json();
}

function mapSeriesSummary(item: Record<string, unknown>) {
  return {
    tmdb_id: item.id as number,
    name: (item.name as string) ?? "",
    overview: (item.overview as string) ?? null,
    poster_path: (item.poster_path as string) ?? null,
    backdrop_path: (item.backdrop_path as string) ?? null,
    first_air_date: (item.first_air_date as string) || null,
    vote_average: (item.vote_average as number) ?? null,
  };
}

function mapEpisodeStub(stub: TmdbEpisodeStub | null | undefined) {
  if (!stub) {
    return null;
  }

  return {
    tmdb_episode_id: stub.id,
    season_number: stub.season_number,
    episode_number: stub.episode_number,
    name: stub.name ?? "",
    air_date: stub.air_date || null,
  };
}

function mapSeriesDetail(item: Record<string, unknown>) {
  const seasons = ((item.seasons as TmdbSeasonSummary[]) ?? [])
    .filter((season) => season.season_number > 0)
    .map((season) => ({
      season_number: season.season_number,
      episode_count: season.episode_count,
      name: season.name,
      air_date: season.air_date || null,
      poster_path: season.poster_path,
    }));

  const trackableEpisodes = seasons.reduce((total, season) => total + season.episode_count, 0);

  return {
    tmdb_id: item.id as number,
    name: (item.name as string) ?? "",
    overview: (item.overview as string) ?? null,
    poster_path: (item.poster_path as string) ?? null,
    backdrop_path: (item.backdrop_path as string) ?? null,
    first_air_date: (item.first_air_date as string) || null,
    last_air_date: (item.last_air_date as string) || null,
    number_of_seasons: seasons.length,
    number_of_episodes: trackableEpisodes,
    vote_average: (item.vote_average as number) ?? null,
    genres: ((item.genres as TmdbGenre[]) ?? []).map((genre) => genre.name),
    tmdb_status: (item.status as string) ?? null,
    in_production: (item.in_production as boolean) ?? false,
    last_episode_to_air: mapEpisodeStub(item.last_episode_to_air as TmdbEpisodeStub | null),
    next_episode_to_air: mapEpisodeStub(item.next_episode_to_air as TmdbEpisodeStub | null),
    seasons_meta: seasons,
  };
}

function mapEpisode(item: Record<string, unknown>) {
  return {
    tmdb_episode_id: item.id as number,
    episode_number: item.episode_number as number,
    season_number: item.season_number as number,
    name: (item.name as string) ?? "",
    overview: (item.overview as string) ?? null,
    still_path: (item.still_path as string) ?? null,
    air_date: (item.air_date as string) || null,
    runtime: (item.runtime as number) ?? null,
    vote_average: (item.vote_average as number) ?? null,
  };
}

async function handleSearch(url: URL) {
  const query = url.searchParams.get("q")?.trim();
  const page = url.searchParams.get("page") ?? "1";

  if (!query) {
    return json({ results: [], page: 1, total_pages: 0 }, 200);
  }

  const data = await tmdbFetch("/search/tv", { query, page, include_adult: "false" });

  return json({
    page: data.page,
    total_pages: data.total_pages,
    results: (data.results ?? []).map(mapSeriesSummary),
  }, 200, 300);
}

async function handleTrending(url: URL) {
  const page = url.searchParams.get("page") ?? "1";
  const data = await tmdbFetch("/trending/tv/week", { page });

  return json({
    page: data.page,
    total_pages: data.total_pages,
    results: (data.results ?? []).map(mapSeriesSummary),
  }, 200, 3600);
}

async function handleGenres() {
  const data = await tmdbFetch("/genre/tv/list");

  return json({ genres: (data.genres ?? []) as TmdbGenre[] }, 200, 86400);
}

async function handleDiscover(url: URL) {
  const genre = url.searchParams.get("genre");
  const page = url.searchParams.get("page") ?? "1";
  const sort = url.searchParams.get("sort") ?? "popularity.desc";

  const params: Record<string, string> = {
    page,
    sort_by: sort,
    include_adult: "false",
    "vote_count.gte": "50",
  };

  if (genre) {
    params.with_genres = genre;
  }

  const data = await tmdbFetch("/discover/tv", params);

  return json({
    page: data.page,
    total_pages: Math.min(data.total_pages ?? 0, 500),
    results: (data.results ?? []).map(mapSeriesSummary),
  }, 200, 1800);
}

async function handleRecommendations(tmdbId: string, url: URL) {
  const page = url.searchParams.get("page") ?? "1";
  const data = await tmdbFetch(`/tv/${tmdbId}/recommendations`, { page });

  return json({
    page: data.page,
    total_pages: data.total_pages,
    results: (data.results ?? []).map(mapSeriesSummary),
  }, 200, 3600);
}

async function handleSeriesDetail(tmdbId: string) {
  const data = await tmdbFetch(`/tv/${tmdbId}`);
  return json(mapSeriesDetail(data), 200, 3600);
}

async function handleSeason(tmdbId: string, seasonNumber: string) {
  const data = await tmdbFetch(`/tv/${tmdbId}/season/${seasonNumber}`);

  return json({
    season_number: data.season_number,
    name: data.name,
    overview: data.overview ?? null,
    poster_path: data.poster_path ?? null,
    air_date: data.air_date || null,
    episodes: (data.episodes ?? []).map(mapEpisode),
  }, 200, 3600);
}

async function handleCredits(tmdbId: string) {
  const data = await tmdbFetch(`/tv/${tmdbId}/credits`);

  const cast = ((data.cast as Record<string, unknown>[]) ?? [])
    .slice(0, 20)
    .map((item) => ({
      id: item.id as number,
      name: (item.name as string) ?? "",
      character: (item.character as string) ?? "",
      profile_path: (item.profile_path as string) ?? null,
      order: (item.order as number) ?? 0,
    }));

  return json({ cast }, 200, 86400);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!TMDB_ACCESS_TOKEN) {
    return json({ error: "tmdb_token_not_configured" }, 500);
  }

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const route = segments.slice(segments.indexOf("tmdb") + 1);

  try {
    if (route[0] === "search") {
      return await handleSearch(url);
    }

    if (route[0] === "trending") {
      return await handleTrending(url);
    }

    if (route[0] === "genres") {
      return await handleGenres();
    }

    if (route[0] === "discover") {
      return await handleDiscover(url);
    }

    if (route[0] === "series" && route[1] && route.length === 2) {
      return await handleSeriesDetail(route[1]);
    }

    if (route[0] === "series" && route[1] && route[2] === "recommendations") {
      return await handleRecommendations(route[1], url);
    }

    if (route[0] === "series" && route[1] && route[2] === "season" && route[3]) {
      return await handleSeason(route[1], route[3]);
    }

    if (route[0] === "series" && route[1] && route[2] === "credits") {
      return await handleCredits(route[1]);
    }

    return json({ error: "not_found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const status = message.startsWith("tmdb_error_") ? Number(message.split("_").pop()) : 500;

    return json({ error: message }, status >= 400 && status < 600 ? status : 500);
  }
});
