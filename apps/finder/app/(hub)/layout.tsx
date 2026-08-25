import { cookies } from "next/headers";
import { renderHubChrome } from "@/components/layout/SparkleFinderHubChrome";
import {
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";

export default async function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);

  return renderHubChrome(children, await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode }));
}
