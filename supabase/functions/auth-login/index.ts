const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function emailForUsername(username: string): Promise<string | null> {
  const profileResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=id&username=ilike.${encodeURIComponent(username)}&limit=1`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!profileResponse.ok) {
    return null;
  }

  const profiles = await profileResponse.json();

  if (!Array.isArray(profiles) || profiles.length === 0) {
    return null;
  }

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${profiles[0].id}`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });

  if (!userResponse.ok) {
    return null;
  }

  const user = await userResponse.json();
  return user.email ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  let payload: { identifier?: string; password?: string };

  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const identifier = payload.identifier?.trim();
  const password = payload.password;

  if (!identifier || !password) {
    return json({ error: "missing_credentials" }, 400);
  }

  const email = looksLikeEmail(identifier) ? identifier : await emailForUsername(identifier);

  if (!email) {
    return json({ error: "invalid_credentials" }, 400);
  }

  const tokenResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const session = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return json({ error: "invalid_credentials" }, 400);
  }

  return json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
});
