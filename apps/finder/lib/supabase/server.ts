import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSparkleFinderSupabaseConfig } from "./config";

const missingSupabaseConfigMessage =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";

export async function createClient() {
  const config = getSparkleFinderSupabaseConfig();

  if (!config) {
    throw new Error(missingSupabaseConfigMessage);
  }

  const cookieStore = await cookies();

  return createServerClient(
    config.url,
    config.publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies; proxy.ts refreshes auth cookies.
          }
        },
      },
    },
  );
}
