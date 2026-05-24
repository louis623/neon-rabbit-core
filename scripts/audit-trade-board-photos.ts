import { pathToFileURL } from 'node:url'

import { config } from 'dotenv'

import { resolveAmethystPreviewRep } from '@/lib/amethyst/preview-rep'
import { createAdminClient } from '@/lib/supabase/admin'
import { classifyJewelryPhotoSemantics } from '@/lib/services/jewelry-photo-semantics'
import { analyzeServerImageQuality } from '@/lib/services/server-image-quality'

type AuditFinding = {
  listingId: string
  designId: string
  itemNumber: string
  designName: string
  status: string
  photoUrl: string | null
  photoSource: 'listing' | 'canonical' | 'missing'
  role: 'jewelry' | 'label_or_packaging' | 'uncertain' | 'missing' | 'unreadable'
  reasons: string[]
  recommendedAction: string
}

function getRepIdFromArgs(args: string[]) {
  const explicit = args.find((arg) => arg.startsWith('--rep-id='))
  return explicit?.slice('--rep-id='.length) || process.env.DEMO_REP_ID || null
}

function getPhotoSource(row: {
  listing_photo_url: string | null
  uses_canonical_photo: boolean
  design: { canonical_photo_url: string | null }
}): AuditFinding['photoSource'] {
  if (row.listing_photo_url) return 'listing'
  if (row.uses_canonical_photo && row.design.canonical_photo_url) return 'canonical'
  return 'missing'
}

function recommendAction(finding: Pick<AuditFinding, 'role' | 'photoSource'>) {
  if (finding.role === 'missing') return 'Add one clear jewelry-front photo.'
  if (finding.role === 'unreadable') return 'Review the URL and replace if it cannot be fetched.'
  if (finding.role === 'label_or_packaging') {
    return finding.photoSource === 'canonical'
      ? 'Replace the canonical photo before listing from catalog fallback.'
      : 'Replace the custom listing photo with a jewelry-front photo.'
  }
  if (finding.role === 'uncertain') return 'Human review recommended before launch.'
  return 'No action needed.'
}

export async function auditTradeBoardPhotos(options: {
  repId?: string | null
} = {}) {
  const admin = createAdminClient()
  const rep =
    options.repId?.trim()
      ? { id: options.repId.trim() }
      : await resolveAmethystPreviewRep(admin, {
          env: process.env,
          select: 'id',
        })
  if (!rep?.id) {
    throw new Error('No demo rep could be resolved for trade-board photo audit.')
  }

  const { data, error } = await admin
    .from('trade_listings')
    .select(
      'id, status, listing_photo_url, uses_canonical_photo, design:jewelry_designs(id, item_number, design_name, canonical_photo_url)',
    )
    .eq('rep_id', rep.id)
    .order('updated_at', { ascending: false })
  if (error) throw error

  const findings: AuditFinding[] = []
  for (const row of data ?? []) {
    const designRel = row.design as
      | {
          id: string
          item_number: string
          design_name: string
          canonical_photo_url: string | null
        }
      | Array<{
          id: string
          item_number: string
          design_name: string
          canonical_photo_url: string | null
        }>
      | null
    const design = Array.isArray(designRel) ? designRel[0] : designRel
    if (!design) continue

    const photoSource = getPhotoSource({
      listing_photo_url: row.listing_photo_url as string | null,
      uses_canonical_photo: Boolean(row.uses_canonical_photo),
      design: { canonical_photo_url: design.canonical_photo_url },
    })
    const photoUrl =
      (row.listing_photo_url as string | null) ?? design.canonical_photo_url

    const base = {
      listingId: row.id as string,
      designId: design.id,
      itemNumber: design.item_number,
      designName: design.design_name,
      status: row.status as string,
      photoUrl,
      photoSource,
    }

    if (!photoUrl) {
      const finding = {
        ...base,
        role: 'missing' as const,
        reasons: ['no listing or canonical photo URL'],
        recommendedAction: '',
      }
      findings.push({
        ...finding,
        recommendedAction: recommendAction(finding),
      })
      continue
    }

    try {
      const response = await fetch(photoUrl)
      if (!response.ok) throw new Error(`fetch failed with ${response.status}`)
      const analysis = await analyzeServerImageQuality(
        new Uint8Array(await response.arrayBuffer()),
      )
      const semantic = classifyJewelryPhotoSemantics(analysis)
      const finding = {
        ...base,
        role: semantic.role,
        reasons: semantic.reasons,
        recommendedAction: '',
      }
      findings.push({
        ...finding,
        recommendedAction: recommendAction(finding),
      })
    } catch (error) {
      const finding = {
        ...base,
        role: 'unreadable' as const,
        reasons: [error instanceof Error ? error.message : String(error)],
        recommendedAction: '',
      }
      findings.push({
        ...finding,
        recommendedAction: recommendAction(finding),
      })
    }
  }

  return {
    repId: rep.id as string,
    findingCount: findings.length,
    flaggedCount: findings.filter((finding) => finding.role !== 'jewelry').length,
    findings,
  }
}

async function main() {
  config({ path: '.env.local' })
  const report = await auditTradeBoardPhotos({
    repId: getRepIdFromArgs(process.argv.slice(2)),
  })
  console.log(JSON.stringify(report, null, 2))
  if (
    report.findings.some(
      (finding) =>
        finding.status === 'available' &&
        (finding.role === 'label_or_packaging' ||
          finding.role === 'missing' ||
          finding.role === 'unreadable'),
    )
  ) {
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(
      '[audit-trade-board-photos] failed:',
      error instanceof Error ? error.message : error,
    )
    process.exitCode = 1
  })
}
