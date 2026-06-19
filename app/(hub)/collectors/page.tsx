import { cookies } from "next/headers";
import Link from "next/link";
import { CollectorSearch } from "@/components/social/CollectorSearch";
import { CollectorSocialPanel } from "@/components/social/CollectorSocialPanel";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import { parseSparkleFinderAuthMode, sparkleFinderAuthCookieName, type SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import {
  searchPersistedPublicCollectorProfiles,
  searchPublicCollectorProfiles,
  type SupabaseCollectorSocialReadClient,
} from "@/lib/sparkle-finder/collector-social-service";
import { createClient } from "@/lib/supabase/server";
import type { PublicCollectorProfile } from "@/lib/sparkle-finder/social-types";
import {
  blockCollectorAction,
  followCollectorAction,
  reportCollectorAction,
  unfollowCollectorAction,
} from "./actions";

type CollectorsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function CollectorsPage({ searchParams }: CollectorsPageProps) {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const accountState = await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });
  const query = cleanQuery((await searchParams)?.q);
  const persistedCollectors =
    accountState.status === "authenticated" && accountState.isLocalPreview !== true
      ? await getCollectorsForRealAccount(query)
      : undefined;

  return renderCollectorsPageContent(accountState, query, persistedCollectors);
}

export function renderCollectorsPageContent(
  accountState: SparkleFinderAccountState,
  query = "",
  persistedCollectors?: PublicCollectorProfile[],
) {
  const cleanSearch = cleanQuery(query);

  if (accountState.status !== "authenticated") {
    return (
      <section className="grid gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Sparkle Showcase</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
            Collectors
          </h1>
        </div>
        <div className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <p className="text-sm font-semibold leading-6 text-[var(--sparkle-ink-muted)]">
            Sign in to discover public collector Showcases.
          </p>
          <Link
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white"
            href="/auth/sign-in"
          >
            Sign in
          </Link>
        </div>
      </section>
    );
  }

  const collectors =
    persistedCollectors ??
    searchPublicCollectorProfiles({
      query: cleanSearch,
      viewerUserId: accountState.customer.id,
      limit: 12,
    });

  return (
    <section className="grid gap-6">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,34rem)] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Collector discovery</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
            Collectors
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Find public Sparkle Showcase profiles, follow one-way shortcuts, and keep safety controls close.
          </p>
        </div>
        <CollectorSearch query={cleanSearch} />
      </div>

      <CollectorSocialPanel
        blockAction={blockCollectorAction}
        collectors={collectors}
        followAction={followCollectorAction}
        reportAction={reportCollectorAction}
        unfollowAction={unfollowCollectorAction}
        viewerUserId={accountState.customer.id}
      />
    </section>
  );
}

function cleanQuery(value: unknown): string {
  return String(value ?? "")
    .trim()
    .slice(0, 80);
}

async function getCollectorsForRealAccount(query: string): Promise<PublicCollectorProfile[]> {
  try {
    const supabase = await createClient();
    const readClient = supabase as unknown as SupabaseCollectorSocialReadClient;
    const collectors = await searchPersistedPublicCollectorProfiles({
      supabase: readClient,
      query,
      limit: 12,
    });

    return collectors ?? [];
  } catch {
    return [];
  }
}
