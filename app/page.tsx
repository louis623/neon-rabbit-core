import { cookies } from "next/headers";
import { AuthenticatedHomePage } from "@/components/home/AuthenticatedHomePage";
import { PublicLandingPage } from "@/components/home/PublicLandingPage";
import {
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import {
  getCurrentSparkleFinderAccount,
  type CurrentSparkleFinderAccountState,
} from "@/lib/sparkle-finder/account-service";

export function renderPublicHomeContent(accountState: CurrentSparkleFinderAccountState) {
  return <PublicLandingPage accountState={accountState} />;
}

export function renderHomeContent(accountState: CurrentSparkleFinderAccountState) {
  return accountState.status === "authenticated" ? (
    <AuthenticatedHomePage accountState={accountState} />
  ) : (
    renderPublicHomeContent(accountState)
  );
}

export default async function Home() {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const accountState = await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });

  return renderHomeContent(accountState);
}
