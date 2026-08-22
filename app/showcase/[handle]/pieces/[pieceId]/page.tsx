import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SparkleFinderFooter } from "@/components/layout/SparkleFinderFooter";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import { RevealSpotlight } from "@/components/showcase/RevealSpotlight";
import {
  getCurrentSparkleFinderAccount,
  type CurrentSparkleFinderAccountState,
} from "@/lib/sparkle-finder/account-service";
import {
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getRevealSpotlight } from "@/lib/sparkle-finder/showcase-service";
import { createRevealSpotlightMetadata } from "@/lib/sparkle-finder/showcase-metadata";
import type { RevealSpotlight as RevealSpotlightData } from "@/lib/sparkle-finder/showcase-types";

type RevealSpotlightPageProps = {
  params: Promise<{
    handle: string;
    pieceId: string;
  }>;
};

export async function generateMetadata({ params }: RevealSpotlightPageProps): Promise<Metadata> {
  const { handle, pieceId } = await params;
  const accountState = await getRevealAccountState();
  const spotlight = await getRevealSpotlight(handle, pieceId, {
    viewerUserId: accountState.status === "authenticated" ? accountState.customer.id : null,
  });

  return spotlight ? createRevealSpotlightMetadata(spotlight) : { title: "Reveal Spotlight | Sparkle Finder" };
}

export default async function RevealSpotlightPage({ params }: RevealSpotlightPageProps) {
  const accountState = await getRevealAccountState();
  const { handle, pieceId } = await params;
  const spotlight = await getRevealSpotlight(handle, pieceId, {
    viewerUserId: accountState.status === "authenticated" ? accountState.customer.id : null,
  });

  if (!spotlight) {
    notFound();
  }

  return renderRevealSpotlightPageContent(spotlight, accountState);
}

async function getRevealAccountState() {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  return getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });
}

export function renderRevealSpotlightPageContent(
  spotlight: RevealSpotlightData,
  accountState: CurrentSparkleFinderAccountState = anonymousRevealAccountState(),
) {
  const viewerUserId = accountState.status === "authenticated" ? accountState.customer.id : null;

  return (
    <>
      <SparkleFinderNav accountState={accountState} variant={accountState.status === "authenticated" ? "app" : "public"} />
      <main className="mx-auto grid w-full max-w-[112rem] gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <RevealSpotlight spotlight={spotlight} viewerUserId={viewerUserId} />
      </main>
      <SparkleFinderFooter />
    </>
  );
}

function anonymousRevealAccountState(): CurrentSparkleFinderAccountState {
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
