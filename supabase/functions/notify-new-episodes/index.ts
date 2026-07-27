import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const TMDB_ACCESS_TOKEN = Deno.env.get("TMDB_ACCESS_TOKEN") ?? "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:notifications@episodic.app";

const IS_V4_TOKEN = TMDB_ACCESS_TOKEN.includes(".");

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type SeasonMeta = { season_number: number; episode_count: number };
type EpisodeStub = { season_number: number; episode_number: number } | null;

type SeriesRow = {
  id: string;
  tmdb_id: number;
  name: string;
  aired_episodes: number;
  seasons_meta: SeasonMeta[];
};

async function tmdbSeries(tmdbId: number): Promise<{ last: EpisodeStub; status: string } | null> {
  const url = new URL(`https://api.themoviedb.org/3/tv/${tmdbId}`);
  const headers: Record<string, string> = { accept: "application/json" };
  if (IS_V4_TOKEN) {
    headers.Authorization = `Bearer ${TMDB_ACCESS_TOKEN}`;
  } else {
    url.searchParams.set("api_key", TMDB_ACCESS_TOKEN);
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    return null;
  }
  const body = await res.json();
  return { last: (body.last_episode_to_air ?? null) as EpisodeStub, status: (body.status ?? "") as string };
}

function airedCount(seasons: SeasonMeta[], last: EpisodeStub, status: string): number {
  const trackable = seasons.reduce((total, s) => total + s.episode_count, 0);
  if (!last) {
    return ["ended", "canceled", "cancelled"].includes(status.trim().toLowerCase()) ? trackable : 0;
  }
  const prior = seasons
    .filter((s) => s.season_number < last.season_number)
    .reduce((total, s) => total + s.episode_count, 0);
  return Math.min(prior + last.episode_number, trackable);
}

async function pushToUsers(userIds: string[], payload: unknown): Promise<void> {
  if (userIds.length === 0 || !VAPID_PRIVATE_KEY) {
    return;
  }

  const { data: subs } = await service
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  await Promise.all(
    (subs ?? []).map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await service.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const allWatchingRows: { series_id: string }[] = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data } = await service
      .from("user_series_status")
      .select("series_id")
      .eq("status", "watching")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    const rows = (data ?? []) as { series_id: string }[];
    allWatchingRows.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    page += 1;
  }

  const seriesIds = [...new Set(allWatchingRows.map((r) => r.series_id))];

  if (seriesIds.length === 0) {
    return new Response(JSON.stringify({ checked: 0, updated: 0, notified: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const seriesRows: SeriesRow[] = [];
  const ID_CHUNK = 200;
  for (let index = 0; index < seriesIds.length; index += ID_CHUNK) {
    const { data } = await service
      .from("series")
      .select("id, tmdb_id, name, aired_episodes, seasons_meta")
      .in("id", seriesIds.slice(index, index + ID_CHUNK));
    seriesRows.push(...((data ?? []) as SeriesRow[]));
  }

  let updated = 0;
  let notified = 0;

  for (const series of seriesRows) {
    const detail = await tmdbSeries(series.tmdb_id);
    if (!detail) {
      continue;
    }

    const aired = airedCount(series.seasons_meta ?? [], detail.last, detail.status);

    if (aired <= series.aired_episodes) {
      continue;
    }

    await service.from("series").update({ aired_episodes: aired }).eq("id", series.id);

    if (series.aired_episodes === 0) {
      continue;
    }

    updated += 1;

    const { data: watchers } = await service
      .from("user_series_status")
      .select("user_id")
      .eq("series_id", series.id)
      .eq("status", "watching");

    const userIds = (watchers ?? []).map((w: { user_id: string }) => w.user_id);
    if (userIds.length === 0) {
      continue;
    }

    const season = detail.last?.season_number ?? null;
    const episode = detail.last?.episode_number ?? null;

    await service.from("notifications").insert(
      userIds.map((userId) => ({
        user_id: userId,
        type: "new_episode",
        series_id: series.id,
        season_number: season,
        episode_number: episode,
      }))
    );

    await pushToUsers(userIds, {
      title: `New episode of ${series.name}`,
      body: season && episode ? `Season ${season}, Episode ${episode} is out.` : "A new episode is out.",
      url: `/series/${series.tmdb_id}`,
      tag: `new_episode:${series.id}`,
    });

    notified += userIds.length;
    await new Promise((r) => setTimeout(r, 50));
  }

  return new Response(JSON.stringify({ checked: seriesIds.length, updated, notified }), {
    headers: { "Content-Type": "application/json" },
  });
});
