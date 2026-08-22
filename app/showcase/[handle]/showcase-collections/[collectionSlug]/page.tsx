import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { SparkleFinderFooter } from "@/components/layout/SparkleFinderFooter";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import { ShowcasePieceGrid } from "@/components/showcase/ShowcasePieceGrid";
import { ShareShowcaseButton } from "@/components/showcase/ShareShowcaseButton";
import {
  getCurrentSparkleFinderAccount,
  type CurrentSparkleFinderAccountState,
} from "@/lib/sparkle-finder/account-service";
import {
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getPublicSparkleShowcaseByHandle } from "@/lib/sparkle-finder/showcase-service";
import { createShowcaseCollectionMetadata } from "@/lib/sparkle-finder/showcase-metadata";
import { buildShowcaseCollectionPath } from "@/lib/sparkle-finder/showcase-sharing";
import type { ShowcaseCollectionWithPieces, SparkleShowcase } from "@/lib/sparkle-finder/showcase-types";

type ShowcaseCollectionPageProps = {
  params: Promise<{
    collectionSlug: string;
    handle: string;
  }>;
};

export async function generateMetadata({ params }: ShowcaseCollectionPageProps): Promise<Metadata> {
  const { collectionSlug, handle } = await params;
  const accountState = await getCollectionAccountState();
  const showcase = await getPublicSparkleShowcaseByHandle(handle, {
    viewerUserId: accountState.status === "authenticated" ? accountState.customer.id : null,
  });
  const collection = showcase?.showcaseCollections.find(
    (candidate) => candidate.slug === collectionSlug.trim().toLowerCase(),
  );

  return showcase && collection
    ? createShowcaseCollectionMetadata(showcase, collection)
    : { title: "Showcase Collection | Sparkle Finder" };
}

export default async function ShowcaseCollectionPage({ params }: ShowcaseCollectionPageProps) {
  const accountState = await getCollectionAccountState();
  const { collectionSlug, handle } = await params;
  const showcase = await getPublicSparkleShowcaseByHandle(handle, {
    viewerUserId: accountState.status === "authenticated" ? accountState.customer.id : null,
  });
  const showcaseCollection = showcase?.showcaseCollections.find(
    (collection) => collection.slug === collectionSlug.trim().toLowerCase(),
  );

  if (!showcase || !showcaseCollection) {
    notFound();
  }

  return renderShowcaseCollectionPageContent(showcase, showcaseCollection, accountState);
}

async function getCollectionAccountState() {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  return getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });
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
          <div className="mt-5">
            <ShareShowcaseButton
              isPublic
              label="Share Collection"
              pathname={buildShowcaseCollectionPath(showcase.profile.handle, showcaseCollection.slug)}
              shareText={`Browse ${showcaseCollection.title}, a public Showcase Collection from ${showcase.profile.customer.displayName}.`}
              shareTitle={`${showcaseCollection.title} | Sparkle Finder`}
              tone="secondary"
            />
          </div>
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
