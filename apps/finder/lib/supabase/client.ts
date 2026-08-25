import { createBrowserClient } from "@supabase/ssr";
import { getSparkleFinderSupabaseConfig } from "./config";

const missingSupabaseConfigMessage =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";

export { getSparkleFinderSupabaseConfig };

function getBrowserSupabaseConfig() {
  return getSparkleFinderSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getBrowserSupabaseConfig());
}

export function createClient() {
  const config = getBrowserSupabaseConfig();

  if (!config) {
    throw new Error(missingSupabaseConfigMessage);
  }

  return createBrowserClient(config.url, config.publishableKey);
}
