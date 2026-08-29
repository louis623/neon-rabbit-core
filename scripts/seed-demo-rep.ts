import { pathToFileURL } from 'node:url'

import { config } from 'dotenv'

import { createAdminClient } from '@/lib/supabase/admin'

const DEMO_SEED_TAG = '__sparkle_demo_seed_v1'
export const DEFAULT_DEMO_PASSWORD = 'SparkleDemo2026!'

type RepSeed = {
  email: string
  displayName: string
  businessName: string
  shopLink: string
  streamingLinks: Record<string, string>
  socialHandles: Record<string, string>
}

type SiteSettingsSeed = {
  tagline: string
  bannerText: string
  bannerVisible: boolean
  tickerText: string
  tickerVisible: boolean
  teamName: string
  showJoinPage: boolean
  heroAnimationType: string
}

type ShowSeed = {
  title: string
  description: string
  platform: string
  eventTime: Date
  durationMinutes: number
  discountCodes: Array<{ code: string; description: string }>
  featuredCollections: string[]
  status: 'scheduled'
}

type DesignSeed = {
  itemNumber: string
  designName: string
  collection: string
  material: string
  mainStone: string
  bpMsrp: number
  typePrefix: 'RG' | 'NK' | 'ER' | 'ST' | 'BR'
  specialFeatures: string
}

type ListingSeed = {
  itemNumber: string
  status: 'available'
  tradePreferences: string
  repNotes: string
}

type AudienceMemberSeed = {
  name: string
  phone: string | null
  email: string | null
  smsConsent: boolean
  emailConsent: boolean
  marketingConsent: boolean
}

export type DemoSeedPlan = {
  rep: RepSeed
  siteSettings: SiteSettingsSeed
  upcomingShows: ShowSeed[]
  designs: DesignSeed[]
  listings: ListingSeed[]
  audienceMembers: AudienceMemberSeed[]
  providerActions: {
    sendSms: false
    sendSignWellLiveAgreement: false
    chargeStripe: false
    callPaidNicNac: false
  }
}

type DemoCalendarEventRow = {
  rep_id: string
  title: string
  description: string
  platform: string
  event_time: string
  duration_minutes: number
  discount_codes: ShowSeed['discountCodes']
  featured_collections: string[]
  status: ShowSeed['status']
  recurrence_group_id: null
}

export type DemoSeedResult = {
  repId: string
  siteSettingsId: string
  designIds: string[]
  listingIds: string[]
  showIds: string[]
  audienceIds: string[]
}

export function getRequiredDemoRepEmail(env: Record<string, string | undefined>) {
  const email = env.DEMO_REP_EMAIL?.trim().toLowerCase()
  if (!email) {
    throw new Error('DEMO_REP_EMAIL is required to seed a demo rep account')
  }
  return email
}

export function getDemoRepPassword(env: Record<string, string | undefined>) {
  return env.DEMO_REP_PASSWORD?.trim() || DEFAULT_DEMO_PASSWORD
}

export function shouldUpdateExistingDemoPassword(
  env: Record<string, string | undefined>,
) {
  return Boolean(env.DEMO_REP_PASSWORD?.trim())
}

function daysFrom(now: Date, days: number, hourUtc: number) {
  const date = new Date(now)
  date.setUTCDate(date.getUTCDate() + days)
  date.setUTCHours(hourUtc, 0, 0, 0)
  return date
}

export function buildDemoCalendarEventRows(
  repId: string,
  plan: DemoSeedPlan,
): DemoCalendarEventRow[] {
  return plan.upcomingShows.map((show) => ({
    rep_id: repId,
    title: show.title,
    description: show.description,
    platform: show.platform,
    event_time: show.eventTime.toISOString(),
    duration_minutes: show.durationMinutes,
    discount_codes: show.discountCodes,
    featured_collections: show.featuredCollections,
    status: show.status,
    recurrence_group_id: null,
  }))
}

export function buildDemoSeedPlan(input: { email: string; now?: Date }): DemoSeedPlan {
  const now = input.now ?? new Date()
  const email = input.email.trim().toLowerCase()

  const designs: DesignSeed[] = [
    {
      itemNumber: 'DM-RG-2601',
      designName: 'Moonlit Meridian Ring',
      collection: 'Demo Celestial',
      material: 'Rhodium Plating',
      mainStone: 'Lab-Created Sapphire',
      bpMsrp: 128,
      typePrefix: 'RG',
      specialFeatures: 'High-profile oval center with pave shoulder detail',
    },
    {
      itemNumber: 'DM-RG-2602',
      designName: 'Starlace Promise Ring',
      collection: 'Demo Celestial',
      material: 'Rose Gold Plating',
      mainStone: 'Cubic Zirconia',
      bpMsrp: 118,
      typePrefix: 'RG',
      specialFeatures: 'Open lace gallery with stackable silhouette',
    },
    {
      itemNumber: 'DM-NK-2603',
      designName: 'Aurora Drop Necklace',
      collection: 'Demo Luxe',
      material: 'Gold Plating',
      mainStone: 'Lab-Created Opal',
      bpMsrp: 136,
      typePrefix: 'NK',
      specialFeatures: 'Adjustable chain with layered halo pendant',
    },
    {
      itemNumber: 'DM-NK-2604',
      designName: 'Velvet Orbit Pendant',
      collection: 'Demo Galaxy',
      material: 'Rhodium Plating',
      mainStone: 'Lab-Created Amethyst',
      bpMsrp: 142,
      typePrefix: 'NK',
      specialFeatures: 'Orbit frame with mixed baguette accents',
    },
    {
      itemNumber: 'DM-ER-2605',
      designName: 'Fizzlight Huggie Earrings',
      collection: 'Demo Luxe',
      material: 'Rose Gold Plating',
      mainStone: 'Lab-Created Morganite',
      bpMsrp: 124,
      typePrefix: 'ER',
      specialFeatures: 'Huggie hoop with removable charm drop',
    },
    {
      itemNumber: 'DM-ER-2606',
      designName: 'Nova Bloom Studs',
      collection: 'Demo Garden',
      material: 'Gold Plating',
      mainStone: 'Cubic Zirconia',
      bpMsrp: 112,
      typePrefix: 'ER',
      specialFeatures: 'Petal-set stones with low-profile backs',
    },
    {
      itemNumber: 'DM-ST-2607',
      designName: 'Afterglow Trio Set',
      collection: 'Demo Galaxy',
      material: 'Rhodium Plating',
      mainStone: 'Lab-Created Tanzanite',
      bpMsrp: 148,
      typePrefix: 'ST',
      specialFeatures: 'Three-piece coordinated ring and earring set',
    },
    {
      itemNumber: 'DM-ST-2608',
      designName: 'Golden Hour Stack',
      collection: 'Demo Luxe',
      material: 'Gold Plating',
      mainStone: 'Lab-Created Citrine',
      bpMsrp: 152,
      typePrefix: 'ST',
      specialFeatures: 'Stackable set with warm-tone stone mix',
    },
    {
      itemNumber: 'DM-BR-2609',
      designName: 'Satin Sky Cuff',
      collection: 'Demo Celestial',
      material: 'Rhodium Plating',
      mainStone: 'Lab-Created Aquamarine',
      bpMsrp: 132,
      typePrefix: 'BR',
      specialFeatures: 'Flexible cuff with bezel-set station stones',
    },
    {
      itemNumber: 'DM-BR-2610',
      designName: 'Garden Gala Bracelet',
      collection: 'Demo Garden',
      material: 'Rose Gold Plating',
      mainStone: 'Lab-Created Peridot',
      bpMsrp: 126,
      typePrefix: 'BR',
      specialFeatures: 'Floral links with polished extender chain',
    },
  ]

  return {
    rep: {
      email,
      displayName: 'Launch Demo Rep',
      businessName: 'Sparkle Suite Demo Boutique',
      shopLink: 'https://www.bombparty.com/shop/sparkle-suite-demo',
      streamingLinks: {
        tiktok: 'https://www.tiktok.com/@sparklesuitedemo',
        facebook: 'https://www.facebook.com/sparklesuitedemo',
      },
      socialHandles: {
        tiktok: '@sparklesuitedemo',
        instagram: '@sparklesuitedemo',
        facebook: 'sparklesuitedemo',
      },
    },
    siteSettings: {
      tagline: 'Sparkle picks, dance floor favorites, and show-night fizz.',
      bannerText: 'Demo launch week: join the next live for first-look trades.',
      bannerVisible: true,
      tickerText: 'New demo listings added before every live show.',
      tickerVisible: true,
      teamName: 'Sparkle Demo Circle',
      showJoinPage: true,
      heroAnimationType: 'zoom',
    },
    upcomingShows: [
      {
        title: 'Friday Fizz Preview',
        description: 'A compact demo live with new ring reveals and trade-board walkthroughs.',
        platform: 'TikTok',
        eventTime: daysFrom(now, 4, 23),
        durationMinutes: 75,
        discountCodes: [{ code: 'DEMO10', description: 'Ten percent off demo launch picks' }],
        featuredCollections: ['Demo Celestial', 'Demo Luxe'],
        status: 'scheduled',
      },
      {
        title: 'Sunday Sparkle Reset',
        description: 'Weekend customer follow-up show featuring bracelets, sets, and wishlist trades.',
        platform: 'Facebook',
        eventTime: daysFrom(now, 6, 19),
        durationMinutes: 60,
        discountCodes: [{ code: 'RESET5', description: 'Five percent off Sunday favorites' }],
        featuredCollections: ['Demo Galaxy', 'Demo Garden'],
        status: 'scheduled',
      },
    ],
    designs,
    listings: designs.map((design) => ({
      itemNumber: design.itemNumber,
      status: 'available',
      tradePreferences:
        'Open to similar MSRP trades, especially from the same collection or adjacent metal tones.',
      repNotes: DEMO_SEED_TAG,
    })),
    audienceMembers: [
      {
        name: 'Avery Brooks',
        phone: '+15555550101',
        email: 'avery.demo@example.com',
        smsConsent: true,
        emailConsent: true,
        marketingConsent: true,
      },
      {
        name: 'Mina Patel',
        phone: '+15555550102',
        email: 'mina.demo@example.com',
        smsConsent: true,
        emailConsent: false,
        marketingConsent: true,
      },
      {
        name: 'Jordan Lee',
        phone: null,
        email: 'jordan.demo@example.com',
        smsConsent: false,
        emailConsent: true,
        marketingConsent: true,
      },
      {
        name: 'Camille Hart',
        phone: '+15555550104',
        email: 'camille.demo@example.com',
        smsConsent: true,
        emailConsent: true,
        marketingConsent: false,
      },
      {
        name: 'Noelle Rivera',
        phone: '+15555550105',
        email: 'noelle.demo@example.com',
        smsConsent: false,
        emailConsent: true,
        marketingConsent: false,
      },
    ],
    providerActions: {
      sendSms: false,
      sendSignWellLiveAgreement: false,
      chargeStripe: false,
      callPaidNicNac: false,
    },
  }
}

async function ensureAuthUser(email: string) {
  const admin = createAdminClient()
  const password = getDemoRepPassword(process.env)
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (error) throw new Error(`Failed to list auth users: ${error.message}`)

  const existing = data.users.find((user) => user.email?.toLowerCase() === email)
  if (existing) {
    const updates = shouldUpdateExistingDemoPassword(process.env)
      ? { password, email_confirm: true }
      : { email_confirm: true }
    const { error: updateError } = await admin.auth.admin.updateUserById(
      existing.id,
      updates,
    )
    if (updateError) throw new Error(`Failed to update auth user: ${updateError.message}`)
    return { id: existing.id, created: false }
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError) throw new Error(`Failed to create auth user: ${createError.message}`)
  return { id: created.user.id, created: true }
}

export async function seedDemoRep(plan: DemoSeedPlan): Promise<DemoSeedResult> {
  const admin = createAdminClient()
  const authUser = await ensureAuthUser(plan.rep.email)
  console.log(`[seed-demo] ${authUser.created ? 'created' : 'reused'} auth user ${authUser.id}`)

  const { data: existingRep, error: existingRepError } = await admin
    .from('reps')
    .select('id')
    .eq('email', plan.rep.email)
    .maybeSingle()
  if (existingRepError) throw new Error(`Failed to look up rep: ${existingRepError.message}`)

  let repId: string
  if (existingRep) {
    const { data: updated, error } = await admin
      .from('reps')
      .update({
        auth_user_id: authUser.id,
        account_classification: 'demo',
        display_name: plan.rep.displayName,
        business_name: plan.rep.businessName,
        shop_link: plan.rep.shopLink,
        streaming_links: plan.rep.streamingLinks,
        social_handles: plan.rep.socialHandles,
        template_id: 'default',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingRep.id)
      .select('id')
      .single()
    if (error) throw new Error(`Failed to update rep: ${error.message}`)
    repId = updated.id as string
  } else {
    const { data: inserted, error } = await admin
      .from('reps')
      .insert({
        auth_user_id: authUser.id,
        account_classification: 'demo',
        email: plan.rep.email,
        display_name: plan.rep.displayName,
        business_name: plan.rep.businessName,
        shop_link: plan.rep.shopLink,
        streaming_links: plan.rep.streamingLinks,
        social_handles: plan.rep.socialHandles,
        template_id: 'default',
        status: 'active',
      })
      .select('id')
      .single()
    if (error) throw new Error(`Failed to insert rep: ${error.message}`)
    repId = inserted.id as string
  }
  console.log(`[seed-demo] rep ${repId}`)

  const { data: siteSettings, error: siteSettingsError } = await admin
    .from('site_settings')
    .upsert(
      {
        rep_id: repId,
        tagline: plan.siteSettings.tagline,
        banner_text: plan.siteSettings.bannerText,
        banner_visible: plan.siteSettings.bannerVisible,
        ticker_text: plan.siteSettings.tickerText,
        ticker_visible: plan.siteSettings.tickerVisible,
        team_name: plan.siteSettings.teamName,
        show_join_page: plan.siteSettings.showJoinPage,
        hero_animation_type: plan.siteSettings.heroAnimationType,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'rep_id' },
    )
    .select('id')
    .single()
  if (siteSettingsError) {
    throw new Error(`Failed to upsert site settings: ${siteSettingsError.message}`)
  }
  console.log(`[seed-demo] site_settings ${siteSettings.id}`)

  const collectionIds = new Map<string, string>()
  for (const collectionName of new Set(plan.designs.map((design) => design.collection))) {
    const { data: collection, error } = await admin
      .from('collections')
      .upsert({ name: collectionName }, { onConflict: 'name' })
      .select('id')
      .single()
    if (error) throw new Error(`Failed to upsert collection ${collectionName}: ${error.message}`)
    collectionIds.set(collectionName, collection.id as string)
  }

  const designIds = new Map<string, string>()
  for (const design of plan.designs) {
    const { data: row, error } = await admin
      .from('jewelry_designs')
      .upsert(
        {
          item_number: design.itemNumber,
          design_name: design.designName,
          collection_id: collectionIds.get(design.collection),
          material: design.material,
          main_stone: design.mainStone,
          bp_msrp: design.bpMsrp,
          type_prefix: design.typePrefix,
          special_features: design.specialFeatures,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'item_number' },
      )
      .select('id')
      .single()
    if (error) throw new Error(`Failed to upsert design ${design.itemNumber}: ${error.message}`)
    designIds.set(design.itemNumber, row.id as string)
  }
  console.log(`[seed-demo] jewelry_designs ${Array.from(designIds.values()).join(', ')}`)

  await admin.from('trade_listings').delete().eq('rep_id', repId).eq('rep_notes', DEMO_SEED_TAG)
  const listingRows = plan.listings.map((listing) => ({
    rep_id: repId,
    design_id: designIds.get(listing.itemNumber),
    uses_canonical_photo: true,
    status: listing.status,
    trade_preferences: listing.tradePreferences,
    rep_notes: listing.repNotes,
    listed_at: new Date().toISOString(),
  }))
  const { data: listings, error: listingError } = await admin
    .from('trade_listings')
    .insert(listingRows)
    .select('id')
  if (listingError) throw new Error(`Failed to insert listings: ${listingError.message}`)
  console.log(`[seed-demo] trade_listings ${(listings ?? []).map((row) => row.id).join(', ')}`)

  await admin
    .from('calendar_events')
    .delete()
    .eq('rep_id', repId)
    .in(
      'title',
      plan.upcomingShows.map((show) => show.title),
    )
  const { data: shows, error: showError } = await admin
    .from('calendar_events')
    .insert(buildDemoCalendarEventRows(repId, plan))
    .select('id')
  if (showError) throw new Error(`Failed to insert shows: ${showError.message}`)
  console.log(`[seed-demo] calendar_events ${(shows ?? []).map((row) => row.id).join(', ')}`)

  await admin.from('customer_audience').delete().eq('rep_id', repId)
  const consentDate = new Date().toISOString()
  const { data: audience, error: audienceError } = await admin
    .from('customer_audience')
    .insert(
      plan.audienceMembers.map((member) => ({
        rep_id: repId,
        name: member.name,
        phone: member.phone,
        email: member.email,
        sms_consent: member.smsConsent,
        email_consent: member.emailConsent,
        marketing_consent: member.marketingConsent,
        consent_date: consentDate,
      })),
    )
    .select('id')
  if (audienceError) throw new Error(`Failed to insert audience: ${audienceError.message}`)
  console.log(`[seed-demo] customer_audience ${(audience ?? []).map((row) => row.id).join(', ')}`)

  return {
    repId,
    siteSettingsId: siteSettings.id as string,
    designIds: Array.from(designIds.values()),
    listingIds: (listings ?? []).map((row) => row.id as string),
    showIds: (shows ?? []).map((row) => row.id as string),
    audienceIds: (audience ?? []).map((row) => row.id as string),
  }
}

async function main() {
  config({ path: '.env.local' })
  const email = getRequiredDemoRepEmail(process.env)
  const plan = buildDemoSeedPlan({ email })
  const ids = await seedDemoRep(plan)
  console.log('[seed-demo] complete')
  console.log(JSON.stringify(ids, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('[seed-demo] failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
