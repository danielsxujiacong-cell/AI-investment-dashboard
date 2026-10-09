import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && publishableKey);

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !publishableKey) return null;
  if (!client) {
    const clientUrl = typeof window !== "undefined" && window.location.hostname === "invest.danielxu.cn"
      ? new URL("/supabase", window.location.origin).toString()
      : supabaseUrl;

    client = createClient(clientUrl, publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
      },
    });
  }
  return client;
}
