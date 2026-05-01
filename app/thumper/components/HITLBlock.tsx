import type { ReactNode } from 'react'
import { ListingPreview } from './ListingPreview'
import styles from './HITLBlock.module.css'

// Per-tool copy. Mirrors the set of tools that declare needsApproval:true in
// lib/thumper/tools/*. reject_trade is intentionally absent — it's not a HITL
// tool. Both confirm buttons keep the destructive-red style to match the
// system-prompt contract in lib/thumper/system-prompt.ts.
export const APPROVAL_COPY: Record<
  string,
  { title: ReactNode; confirm: string; cancel: string }
> = {
  approve_trade: {
    title: 'Approve this trade?',
    confirm: 'Approve trade',
    cancel: 'Cancel',
  },
  remove_listing: {
    title: 'Remove this listing from your board?',
    confirm: 'Remove listing',
    cancel: 'Cancel',
  },
  cancel_show: {
    title: 'Cancel this show?',
    confirm: 'Cancel show',
    cancel: 'Keep show',
  },
}

const FALLBACK_COPY = {
  title: 'Approve this action?',
  confirm: 'Approve',
  cancel: 'Cancel',
}

export function HITLBlock({
  approvalId,
  toolName,
  args,
  onRespond,
}: {
  approvalId: string
  toolName: string
  args: Record<string, unknown>
  onRespond: (approved: boolean) => void
}) {
  const copy = APPROVAL_COPY[toolName] ?? FALLBACK_COPY

  // remove_listing renders a compact preview of the target listing above the
  // question. The model passes listingId or itemNumber; designName is rarely
  // available here, so we synthesize a label from whatever's present.
  const showListingPreview = toolName === 'remove_listing'
  const designName =
    (args.designName as string | undefined) ??
    (args.itemNumber ? `Item ${args.itemNumber}` : 'this listing')
  const itemNumber = args.itemNumber as string | undefined

  return (
    <div className={styles.block}>
      {showListingPreview ? (
        <ListingPreview designName={designName} itemNumber={itemNumber} />
      ) : null}
      <div className={styles.question}>{copy.title}</div>
      <div className={styles.btnRow}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => onRespond(false)}
          data-approval-id={approvalId}
        >
          {copy.cancel}
        </button>
        <button
          type="button"
          className={styles.confirmBtn}
          onClick={() => onRespond(true)}
          data-approval-id={approvalId}
        >
          {copy.confirm}
        </button>
      </div>
    </div>
  )
}
