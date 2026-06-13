import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SparkleFinderFooter } from "@/components/layout/SparkleFinderFooter";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import { SparkleShowcaseProfile } from "@/components/showcase/SparkleShowcaseProfile";
import {
  getCurrentSparkleFinderAccount,
  type CurrentSparkleFinderAccountState,
} from "@/lib/sparkle-finder/account-service";
import {
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getPublicSparkleShowcaseByHandle } from "@/lib/sparkle-finder/showcase-service";
import type { SparkleShowcase } from "@/lib/sparkle-finder/showcase-types";

type SparkleShowcasePageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function SparkleShowcasePage({ params }: SparkleShowcasePageProps) {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const accountState = await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });
  const { handle } = await params;
  const showcase = getPublicSparkleShowcaseByHandle(handle);

  if (!showcase) {
    notFound();
  }

  return renderSparkleShowcasePageContent(showcase, accountState);
}

export function renderSparkleShowcasePageContent(
  showcase: SparkleShowcase,
  accountState: CurrentSparkleFinderAccountState = anonymousShowcaseAccountState(),
) {
  const viewerUserId = accountState.status === "authenticated" ? accountState.customer.id : null;

  return (
    <>
      <SparkleFinderNav accountState={accountState} variant={accountState.status === "authenticated" ? "app" : "public"} />
      <main className="mx-auto grid w-full max-w-[112rem] gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <SparkleShowcaseProfile showcase={showcase} viewerUserId={viewerUserId} />
      </main>
      <SparkleFinderFooter />
    </>
  );
}

function anonymousShowcaseAccountState(): CurrentSparkleFinderAccountState {
  return {
    status: "anonymous",
    tier: "anonymous",
    displayName: "Guest",
    email: null,
    customer: null,
    communicationConsent: {
      accountEmailRequired: true,
      accountSmsAllowed: false,
      accountSmsConsentedAt: null,
      promotionalEmailOptIn: false,
      promotionalEmailConsentedAt: null,
      promotionalSmsOptIn: false,
      promotionalSmsConsentedAt: null,
      privacyAcknowledgedAt: null,
    },
  };
}
