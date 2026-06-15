import { config } from 'dotenv'

import { createAdminClient } from '@/lib/supabase/admin'

config({ path: '.env.local', quiet: true })

const SEEDED_CATALOG_TARGETS = [
  ['RG-SMOKE-001', 'Reviewer Smoke Ring'],
  ['DM-BR-2610', 'Garden Gala Bracelet'],
  ['DM-BR-2609', 'Satin Sky Cuff'],
  ['DM-ST-2608', 'Golden Hour Stack'],
  ['DM-ST-2607', 'Afterglow Trio Set'],
  ['DM-ER-2606', 'Nova Bloom Studs'],
  ['DM-ER-2605', 'Fizzlight Huggie Earrings'],
  ['DM-NK-2604', 'Velvet Orbit Pendant'],
  ['DM-NK-2603', 'Aurora Drop Necklace'],
  ['DM-RG-2602', 'Starlace Promise Ring'],
  ['DM-RG-2601', 'Moonlit Meridian Ring'],
] as const

const PROTECTED_ITEM_NUMBER = 'ER76003'

type TargetItemNumber = (typeof SEEDED_CATALOG_TARGETS)[number][0]

type JewelryDesignRow = {
  id: string
  item_number: string
  design_name: string
  canonical_photo_url: string | null
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}

function targetNameFor(itemNumber: string) {
  return new Map<string, string>(SEEDED_CATALOG_TARGETS).get(itemNumber as TargetItemNumber)
}

async function selectIds(
  table: string,
  column: string,
  values: string[],
  select = 'id',
) {
  if (values.length === 0) return []
  const admin = createAdminClient()
  const { data, error } = await admin.from(table).select(select).in(column, values)
  if (error) throw new Error(`${table}.${column} lookup failed: ${error.message}`)
  return ((data ?? []) as unknown as Array<{ id: string }>).map((row) => row.id)
}

async function deleteIds(table: string, ids: string[]) {
  if (ids.length === 0) return 0
  const admin = createAdminClient()
  const { data, error } = await admin.from(table).delete().in('id', ids).select('id')
  if (error) throw new Error(`${table} delete failed: ${error.message}`)
  return data?.length ?? 0
}

async function loadTargetDesigns() {
  const admin = createAdminClient()
  const itemNumbers = SEEDED_CATALOG_TARGETS.map(([itemNumber]) => itemNumber)
  const { data, error } = await admin
    .from('jewelry_designs')
    .select('id, item_number, design_name, canonical_photo_url')
    .in('item_number', itemNumbers)
    .order('item_number')
  if (error) throw new Error(`target design lookup failed: ${error.message}`)

  return ((data ?? []) as JewelryDesignRow[]).filter((row) => {
    const expectedName = targetNameFor(row.item_number)
    return expectedName === row.design_name && row.canonical_photo_url === null
  })
}

async function assertProtectedDesign() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('jewelry_designs')
    .select('item_number, design_name, canonical_photo_url')
    .eq('item_number', PROTECTED_ITEM_NUMBER)
    .maybeSingle()
  if (error) throw new Error(`protected design lookup failed: ${error.message}`)
  if (!data) throw new Error(`${PROTECTED_ITEM_NUMBER} protected design is missing`)
  if (data.design_name !== 'The Elodie Luxe') {
    throw new Error(`${PROTECTED_ITEM_NUMBER} protected design name mismatch: ${data.design_name}`)
  }
  if (!data.canonical_photo_url) {
    throw new Error(`${PROTECTED_ITEM_NUMBER} protected design has no canonical photo URL`)
  }
}

async function main() {
  const execute = process.argv.includes('--execute')
  await assertProtectedDesign()

  const targetDesigns = await loadTargetDesigns()
  const designIds = targetDesigns.map((row) => row.id)
  const listingIds = await selectIds('trade_listings', 'design_id', designIds)
  const requestIds = await selectIds('trade_requests', 'listing_id', listingIds)
  const fulfillmentIds = unique([
    ...(await selectIds('trade_fulfillment', 'request_id', requestIds)),
    ...(await selectIds('trade_fulfillment', 'received_listing_id', listingIds)),
  ])
  const swapIds = unique([
    ...(await selectIds('trade_swaps', 'request_id', requestIds)),
    ...(await selectIds('trade_swaps', 'outgoing_listing_id', listingIds)),
    ...(await selectIds('trade_swaps', 'replacement_listing_id', listingIds)),
    ...(await selectIds('trade_swaps', 'revealed_design_id', designIds)),
  ])

  const planned = {
    targetDesigns: targetDesigns.map((row) => ({
      itemNumber: row.item_number,
      designName: row.design_name,
    })),
    counts: {
      tradeSwaps: swapIds.length,
      tradeFulfillment: fulfillmentIds.length,
      tradeRequests: requestIds.length,
      tradeListings: listingIds.length,
      jewelryDesigns: designIds.length,
    },
    protectedItemVerified: PROTECTED_ITEM_NUMBER,
    execute,
  }

  if (!execute) {
    console.log(JSON.stringify({ mode: 'dry-run', ...planned }, null, 2))
    return
  }

  const removed = {
    tradeSwaps: await deleteIds('trade_swaps', swapIds),
    tradeFulfillment: await deleteIds('trade_fulfillment', fulfillmentIds),
    tradeRequests: await deleteIds('trade_requests', requestIds),
    tradeListings: await deleteIds('trade_listings', listingIds),
    jewelryDesigns: await deleteIds('jewelry_designs', designIds),
  }

  await assertProtectedDesign()
  const remainingTargets = await loadTargetDesigns()

  console.log(
    JSON.stringify(
      {
        mode: 'execute',
        planned,
        removed,
        remainingTargetDesigns: remainingTargets.length,
        protectedItemVerified: PROTECTED_ITEM_NUMBER,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
