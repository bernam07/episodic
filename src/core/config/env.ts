type Env = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  vapidPublicKey: string;
};

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env: Env = {
  supabaseUrl: required("VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL),
  supabasePublishableKey: required(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ),
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "",
};
