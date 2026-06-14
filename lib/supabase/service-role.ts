import { createClient } from "@supabase/supabase-js";
import { getAllowedSparkleFinderSupabaseUrl } from "./config";

export function createSupabaseServiceRoleClient(env: Record<string, string | undefined> = process.env) {
  const supabaseUrl = getAllowedSparkleFinderSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
