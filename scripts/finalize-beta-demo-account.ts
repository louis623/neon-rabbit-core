import { pathToFileURL } from 'node:url'

import { config } from 'dotenv'

import { ensureLiveQueueSyncCodeForRep } from '@/lib/services/live-queue'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_BETA_DEMO_EMAIL = 'louis+sparkle-beta-demo@neonrabbit.net'
const DEFAULT_BETA_DEMO_SLUG = 'sparklebetademo'

const COMPLETED_SETUP_STEPS = [
  'account_basics',
  'site_skin',
  'welcome_copy',
  'about_page',
  'show_schedule',
  'customer_site_orientation',
  'live_queue_setup',
  'trade_board_orientation',
  'final_preview_approval',
]

function getEnvValue(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback
}

export async function finalizeBetaDemoAccount() {
  config({ path: '.env.local', quiet: true })

  const admin = createAdminClient()
  const email = getEnvValue('BETA_DEMO_REP_EMAIL', DEFAULT_BETA_DEMO_EMAIL)
  const slug = getEnvValue('BETA_DEMO_PUBLIC_SITE_SLUG', DEFAULT_BETA_DEMO_SLUG)
  const appUrl = getEnvValue(
    'BETA_DEMO_APP_URL',
    'https://sparkle-suite-pmh7z5v7b-louis-2849s-projects.vercel.app',
  ).replace(/\/+$/, '')
  const now = new Date()
  const nowIso = now.toISOString()
  const periodEnd = new Date(
    now.getTime() + 365 * 24 * 60 * 60 * 1000,
  ).toISOString()

  const { data: rep, error: repError } = await admin
    .from('reps')
    .select('id, auth_user_id, email')
    .eq('email', email)
    .single()
  if (repError || !rep) {
    throw new Error(`Rep lookup failed: ${repError?.message ?? 'missing rep'}`)
  }

  const { data: slugOwner, error: slugError } = await admin
    .from('reps')
    .select('id, email')
    .eq('public_site_slug', slug)
    .maybeSingle()
  if (slugError) throw new Error(`Slug lookup failed: ${slugError.message}`)
  if (slugOwner && slugOwner.id !== rep.id) {
    throw new Error(`Slug ${slug} is already owned by ${slugOwner.email}`)
  }

  const { error: repUpdateError } = await admin
    .from('reps')
    .update({
      display_name: 'Louis',
      business_name: 'Sparkle Suite Beta Demo',
      account_classification: 'demo',
      public_site_slug: slug,
      status: 'active',
      shop_link: 'https://www.bombparty.com/shop/sparkle-suite-demo',
      streaming_links: {
        tiktok: 'https://www.tiktok.com/@sparklesuitedemo',
        facebook: 'https://www.facebook.com/sparklesuitedemo',
      },
      social_handles: {
        tiktok: '@sparklesuitedemo',
        instagram: '@sparklesuitedemo',
        facebook: 'sparklesuitedemo',
      },
      updated_at: nowIso,
    })
    .eq('id', rep.id)
  if (repUpdateError) {
    throw new Error(`Rep update failed: ${repUpdateError.message}`)
  }

  const { error: settingsError } = await admin.from('site_settings').upsert(
    {
      rep_id: rep.id,
      tagline:
        'Real beta workspace for Sparkle Suite demos, smoke tests, and content creation.',
      banner_text:
        'Beta demo site: real workspace data, real trade-board records.',
      banner_visible: true,
      ticker_text:
        'Real pieces can be added to the shared jewelry database and listed here for demo trading.',
      ticker_visible: true,
      team_name: 'Sparkle Suite Beta Demo',
      show_join_page: true,
      hero_animation_type: 'sparkle_rise',
      updated_at: nowIso,
    },
    { onConflict: 'rep_id' },
  )
  if (settingsError) {
    throw new Error(`Site settings upsert failed: ${settingsError.message}`)
  }

  const { error: subscriptionError } = await admin.from('subscriptions').upsert(
    {
      rep_id: rep.id,
      stripe_subscription_id: `sub_internal_beta_${rep.id}`,
      stripe_customer_id: `cus_internal_beta_${rep.id}`,
      plan_tier: 'monthly',
      pricing_tier: 'internal_beta',
      status: 'active',
      monthly_amount: 0,
      current_period_start: nowIso,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      stripe_livemode: false,
      updated_at: nowIso,
    },
    { onConflict: 'rep_id' },
  )
  if (subscriptionError) {
    throw new Error(`Subscription upsert failed: ${subscriptionError.message}`)
  }

  const { error: walletError } = await admin.from('sms_wallet').upsert(
    {
      rep_id: rep.id,
      balance_mils: 500_000,
      auto_recharge_enabled: false,
      auto_recharge_threshold_mils: 50_000,
      auto_recharge_amount_mils: 250_000,
      minimum_load_amount_mils: 250_000,
      auto_recharge_pending: false,
      updated_at: nowIso,
    },
    { onConflict: 'rep_id' },
  )
  if (walletError) throw new Error(`Wallet upsert failed: ${walletError.message}`)

  const { error: setupError } = await admin
    .from('self_serve_setup_sessions')
    .upsert(
      {
        rep_id: rep.id,
        status: 'dashboard_unlocked',
        current_step: 'final_preview_approval',
        completed_steps: COMPLETED_SETUP_STEPS,
        answers: {
          account_basics: {
            repName: 'Louis',
            businessName: 'Sparkle Suite Beta Demo',
            email,
            liveShowName: 'Sparkle Beta Demo',
            publicSiteSlug: slug,
            publicSiteUrl: `${appUrl}/${slug}`,
            publicSiteSlugStatus: 'accepted',
            publicSiteSlugRedFlag: null,
            publicSiteSlugAlternatives: [],
          },
          site_skin: {
            preset: 'sparkle_suite_morganite',
          },
          welcome_copy: {
            tagline:
              'Real beta workspace for Sparkle Suite demos, smoke tests, and content creation.',
            bannerText:
              'Beta demo site: real workspace data, real trade-board records.',
            tickerText:
              'Real pieces can be added to the shared jewelry database and listed here for demo trading.',
          },
        },
        generated_copy: {},
        support_state: {
          internal_beta_demo: {
            enabled: true,
            created_at: nowIso,
            purpose:
              'smoke testing and marketing content creation with real persisted data',
          },
        },
        dashboard_unlocked_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'rep_id' },
    )
  if (setupError) {
    throw new Error(`Setup session upsert failed: ${setupError.message}`)
  }

  const sync = await ensureLiveQueueSyncCodeForRep(admin, { repId: rep.id })

  const { count: listingCount, error: listingCountError } = await admin
    .from('trade_listings')
    .select('id', { count: 'exact', head: true })
    .eq('rep_id', rep.id)
  if (listingCountError) {
    throw new Error(`Listing count failed: ${listingCountError.message}`)
  }

  const { count: designCount, error: designCountError } = await admin
    .from('jewelry_designs')
    .select('id', { count: 'exact', head: true })
  if (designCountError) {
    throw new Error(`Design count failed: ${designCountError.message}`)
  }

  return {
    ok: true,
    repId: rep.id as string,
    email,
    publicSiteSlug: slug,
    workspaceUrl: `${appUrl}/nic-nac`,
    customerSiteUrl: `${appUrl}/${slug}`,
    customerTradeBoardUrl: `${appUrl}/amethyst/Trade.html?c=${rep.id}`,
    liveQueueSyncCode: sync.syncCode,
    listingCount,
    totalJewelryDesignCount: designCount,
  }
}

async function main() {
  const result = await finalizeBetaDemoAccount()
  console.log(JSON.stringify(result, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(
      '[finalize-beta-demo-account] failed:',
      error instanceof Error ? error.message : error,
    )
    process.exitCode = 1
  })
}
