import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

import { loadAmethystTradeBoardPreviewListings } from '@/lib/amethyst/trade-board-listings'
import { getReviewerSmokePersona } from '@/lib/reviewer-smoke/config'
import {
  addNonItemNumberListing,
  getMyBoard,
  removeListing,
  restoreListing,
} from '@/lib/services/trade-board'
import {
  getTradeRequests,
  rejectTrade,
  submitTradeRequest,
} from '@/lib/services/trade-requests'
import { ServiceError } from '@/lib/services/errors'

config({ path: '.env.local' })

type Env = Record<string, string | undefined>

const FORBIDDEN_PUBLIC_SOURCE_LANGUAGE = [
  'legacy',
  'miscellaneous',
  'grab bag',
  'unknown',
  'undocumented',
  'Board Pieces',
  'non-item number',
  'piece without item number',
] as const

export interface NonItemNumberPressureSummary {
  marker: string
  repId: string
  listingsCreated: number
  boardRowsVerified: number
  requestsSubmitted: number
  requestsRejected: number
  removedAndRestored: boolean
  jewelryDesignCountBefore: number
  jewelryDesignCountAfter: number
  publicPayloadLeaks: string[]
  cleanupResiduals: number
}

export function buildNonItemNumberPressureSummary(
  input: NonItemNumberPressureSummary,
) {
  return [
    `[non-item-pressure] marker=${input.marker}`,
    `rep=${input.repId}`,
    `listings=${input.listingsCreated}`,
    `board=${input.boardRowsVerified}`,
    `requests=${input.requestsSubmitted}`,
    `rejected=${input.requestsRejected}`,
    `remove_restore=${input.removedAndRestored}`,
    `designs_before=${input.jewelryDesignCountBefore}`,
    `designs_after=${input.jewelryDesignCountAfter}`,
    `public_leaks=${input.publicPayloadLeaks.length}`,
    `cleanup_residuals=${input.cleanupResiduals}`,
  ].join(' ')
}

export function findForbiddenPublicSourceLanguage(text: string): string[] {
  const normalized = text.toLocaleLowerCase()
  return FORBIDDEN_PUBLIC_SOURCE_LANGUAGE.filter((phrase) =>
    normalized.includes(phrase.toLocaleLowerCase()),
  )
}

export function publicPreviewListingsHaveIds(
  listings: Array<{ id?: string }>,
  listingIds: string[],
): boolean {
  const publicIds = new Set(listings.map((listing) => listing.id).filter(Boolean))
  return listingIds.every((listingId) => publicIds.has(listingId))
}

export async function runNonItemNumberPressure(
  env: Env = process.env,
): Promise<NonItemNumberPressureSummary> {
  const missingEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter(
    (name) => !env[name]?.trim(),
  )
  if (missingEnv.length > 0) {
    throw new Error(`Missing required env: ${missingEnv.join(', ')}`)
  }

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const rep = await resolvePressureRep(supabase, env)
  const marker = `non_item_pressure_${Date.now()}`
  const createdListingIds: string[] = []
  const createdRequestIds: string[] = []
  const designCountBefore = await countJewelryDesigns(supabase)

  try {
    const ring = await addNonItemNumberListing(supabase, rep.id, {
      jewelryType: 'RG',
      collectionFamily: 'Birthday',
      collectionName: 'July Birthday 2026',
      size: '7',
      photoUrl: managedPhotoUrl(rep.id, `${marker}_ring.jpg`),
      repNotes: `${marker}: ring`,
      tradePreferences: 'Synthetic pressure listing.',
    })
    createdListingIds.push(ring.listingId)

    const necklace = await addNonItemNumberListing(supabase, rep.id, {
      jewelryType: 'NK',
      collectionFamily: 'Sterling',
      collectionName: 'Sterling Club 2026',
      photoUrl: managedPhotoUrl(rep.id, `${marker}_necklace.jpg`),
      repNotes: `${marker}: necklace`,
      tradePreferences: 'Synthetic pressure listing.',
    })
    createdListingIds.push(necklace.listingId)

    const board = await getMyBoard(supabase, rep.id, {
      statusFilter: 'available',
      sortBy: 'listed_at',
      sortOrder: 'desc',
    })
    const pressureRows = board.listings.filter((listing) =>
      createdListingIds.includes(listing.id),
    )
    if (pressureRows.length !== createdListingIds.length) {
      throw new Error(
        `Expected ${createdListingIds.length} pressure rows on board; found ${pressureRows.length}`,
      )
    }

    const request = await submitTradeRequest(supabase, {
      listingId: ring.listingId,
      expectedRepId: rep.id,
      customerName: `${marker} customer`,
      customerDescription: 'Offering a July Birthday necklace for pressure test.',
    })
    createdRequestIds.push(request.requestId)

    const requests = await getTradeRequests(supabase, rep.id, {
      statusFilter: 'pending',
      limit: 20,
    })
    if (!requests.some((row) => row.id === request.requestId)) {
      throw new Error('Submitted pressure trade request did not appear in inbox.')
    }

    await rejectTrade(
      supabase,
      rep.id,
      request.requestId,
      'other',
      `${marker}: pressure cleanup rejection`,
    )

    const removeResult = await removeListing(supabase, rep.id, {
      listingId: necklace.listingId,
      reason: 'mistake',
    })
    const restoreResult = await restoreListing(supabase, rep.id, {
      listingId: necklace.listingId,
    })

    const publicListings = await loadAmethystTradeBoardPreviewListings({
      repId: rep.id,
      targeted: true,
      limit: 50,
    })
    if (!publicPreviewListingsHaveIds(publicListings, createdListingIds)) {
      throw new Error(
        `Public Trade Board payload did not include all pressure listings. Found ${publicListings.length} row(s).`,
      )
    }
    const publicLeaks = findForbiddenPublicSourceLanguage(
      JSON.stringify(publicListings),
    )
    if (publicLeaks.length > 0) {
      throw new Error(
        `Public Trade Board payload leaked source language: ${publicLeaks.join(', ')}`,
      )
    }

    const designCountAfter = await countJewelryDesigns(supabase)
    if (designCountBefore !== designCountAfter) {
      throw new Error(
        `jewelry_designs count changed from ${designCountBefore} to ${designCountAfter}`,
      )
    }

    await cleanupPressureRows(supabase, createdListingIds, createdRequestIds)
    const cleanupResiduals = await countResidualListings(supabase, createdListingIds)

    return {
      marker,
      repId: rep.id,
      listingsCreated: createdListingIds.length,
      boardRowsVerified: pressureRows.length,
      requestsSubmitted: 1,
      requestsRejected: 1,
      removedAndRestored:
        removeResult.listingId === necklace.listingId &&
        restoreResult.listingId === necklace.listingId,
      jewelryDesignCountBefore: designCountBefore,
      jewelryDesignCountAfter: designCountAfter,
      publicPayloadLeaks: publicLeaks,
      cleanupResiduals,
    }
  } catch (error) {
    await cleanupPressureRows(supabase, createdListingIds, createdRequestIds)
    if (error instanceof ServiceError) {
      throw new Error(`${error.code}: ${error.userMessage}`)
    }
    throw error
  }
}

async function resolvePressureRep(supabase: SupabaseClient, env: Env) {
  const email =
    env.DEMO_REP_EMAIL?.trim() ||
    getReviewerSmokePersona(env as NodeJS.ProcessEnv).email
  const { data, error } = await supabase
    .from('reps')
    .select('id,email,display_name')
    .eq('email', email)
    .maybeSingle()
  if (error) throw error
  const row = data as { id?: string; email?: string; display_name?: string } | null
  if (!row?.id) {
    throw new Error(`Pressure rep not found for ${email}`)
  }
  return {
    id: row.id,
    email: row.email ?? email,
    displayName: row.display_name,
  }
}

function managedPhotoUrl(repId: string, filename: string) {
  return `https://example.supabase.co/storage/v1/object/public/jewelry-photos/${repId}/${filename}`
}

async function countJewelryDesigns(supabase: SupabaseClient) {
  const { count, error } = await supabase
    .from('jewelry_designs')
    .select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

async function cleanupPressureRows(
  supabase: SupabaseClient,
  listingIds: string[],
  requestIds: string[],
) {
  if (requestIds.length > 0) {
    const { error } = await supabase
      .from('trade_requests')
      .delete()
      .in('id', requestIds)
    if (error) throw error
  }
  if (listingIds.length > 0) {
    const { error } = await supabase
      .from('trade_listings')
      .delete()
      .in('id', listingIds)
      .eq('listing_source', 'non_item_number')
    if (error) throw error
  }
}

async function countResidualListings(supabase: SupabaseClient, listingIds: string[]) {
  if (listingIds.length === 0) return 0
  const { data, error } = await supabase
    .from('trade_listings')
    .select('id')
    .in('id', listingIds)
  if (error) throw error
  return (data ?? []).length
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/pressure-non-item-number-trade-listings.ts')) {
  runNonItemNumberPressure()
    .then((summary) => {
      console.log(buildNonItemNumberPressureSummary(summary))
      if (
        summary.cleanupResiduals !== 0 ||
        summary.publicPayloadLeaks.length > 0 ||
        summary.jewelryDesignCountBefore !== summary.jewelryDesignCountAfter
      ) {
        process.exitCode = 1
      }
    })
    .catch((error) => {
      console.error('[non-item-pressure] error', error)
      process.exitCode = 1
    })
}
