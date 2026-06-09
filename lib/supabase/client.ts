import { createBrowserClient } from "@supabase/ssr";
import { getSparkleFinderSupabaseConfig, isSupabaseConfigured } from "./config";

const missingSupabaseConfigMessage =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";

export { getSparkleFinderSupabaseConfig, isSupabaseConfigured };

export function createClient() {
  const config = getSparkleFinderSupabaseConfig();

  if (!config) {
    throw new Error(missingSupabaseConfigMessage);
  }

  return createBrowserClient(config.url, config.publishableKey);
}
