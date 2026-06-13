import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SparkleFinderFooter } from "@/components/layout/SparkleFinderFooter";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import { ShowcasePieceGrid } from "@/components/showcase/ShowcasePieceGrid";
import {
  getCurrentSparkleFinderAccount,
  type CurrentSparkleFinderAccountState,
} from "@/lib/sparkle-finder/account-service";
import {
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getPublicSparkleShowcaseByHandle, getShowcaseCollectionBySlug } from "@/lib/sparkle-finder/showcase-service";
import type { ShowcaseCollectionWithPieces, SparkleShowcase } from "@/lib/sparkle-finder/showcase-types";

type ShowcaseCollectionPageProps = {
  params: Promise<{
    collectionSlug: string;
    handle: string;
  }>;
};

export default async function ShowcaseCollectionPage({ params }: ShowcaseCollectionPageProps) {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const accountState = await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });
  const { collectionSlug, handle } = await params;
  const showcase = getPublicSparkleShowcaseByHandle(handle);
  const showcaseCollection = getShowcaseCollectionBySlug(handle, collectionSlug);

  if (!showcase || !showcaseCollection) {
    notFound();
  }

  return renderShowcaseCollectionPageContent(showcase, showcaseCollection, accountState);
}

export function renderShowcaseCollectionPageContent(
  showcase: SparkleShowcase,
  showcaseCollection: ShowcaseCollectionWithPieces,
  accountState: CurrentSparkleFinderAccountState = anonymousCollectionAccountState(),
) {
  return (
    <>
      <SparkleFinderNav accountState={accountState} variant={accountState.status === "authenticated" ? "app" : "public"} />
      <main className="mx-auto grid w-full max-w-[112rem] gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <header className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)] lg:p-7">
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--sparkle-rose)] hover:underline"
            href={`/showcase/${showcase.profile.handle}`}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to Sparkle Showcase
          </Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Showcase Collection</p>
          <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
            {showcaseCollection.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
            {showcaseCollection.description}
          </p>
        </header>
        <ShowcasePieceGrid
          handle={showcase.profile.handle}
          pieces={showcaseCollection.pieces}
          title={`${showcaseCollection.title} Showcase Collection`}
        />
      </main>
      <SparkleFinderFooter />
    </>
  );
}

function anonymousCollectionAccountState(): CurrentSparkleFinderAccountState {
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
