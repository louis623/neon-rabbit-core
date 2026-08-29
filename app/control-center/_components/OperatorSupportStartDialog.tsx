'use client'

import { useEffect, useRef, useState } from 'react'

export const OPERATOR_SUPPORT_REASONS = [
  { code: 'account_setup', label: 'Account setup help' },
  { code: 'troubleshooting', label: 'Troubleshooting' },
  { code: 'content_update', label: 'Customer-site or content update' },
  { code: 'support_request', label: 'Support request or ticket' },
  { code: 'other', label: 'Other support reason' },
] as const

export type OperatorSupportReasonCode =
  (typeof OPERATOR_SUPPORT_REASONS)[number]['code']

export type StartOperatorSupportInput = {
  targetRepId: string
  reasonCode: OperatorSupportReasonCode
  reasonNote?: string
  supportReportId?: string
}

export function createStartOperatorSupportBody({
  targetRepId,
  reasonCode,
  reasonNote,
  supportReportId,
}: StartOperatorSupportInput) {
  const note = reasonNote?.trim()
  const reportId = supportReportId?.trim()

  return {
    targetRepId,
    reasonCode,
    ...(note ? { reasonNote: note } : {}),
    ...(reportId ? { supportReportId: reportId } : {}),
  }
}

export function OperatorSupportStartDialog({
  open,
  repDisplayName,
  repEmail,
  targetRepId,
  onClose,
  onStart,
}: {
  open: boolean
  repDisplayName: string
  repEmail: string
  targetRepId: string
  onClose: () => void
  onStart: (input: StartOperatorSupportInput) => Promise<void>
}) {
  const [reasonCode, setReasonCode] =
    useState<OperatorSupportReasonCode>('account_setup')
  const [reasonNote, setReasonNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeButtonRef.current?.focus()

    function handleDialogKeys(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const dialog = closeButtonRef.current?.closest('[role="dialog"]')
      if (!(dialog instanceof HTMLElement)) return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleDialogKeys)
    return () => document.removeEventListener('keydown', handleDialogKeys)
  }, [onClose, open, saving])

  if (!open) return null

  const noteRequired = reasonCode === 'other'
  const canStart = !saving && (!noteRequired || reasonNote.trim().length >= 10)

  async function submit() {
    if (!canStart) return
    setSaving(true)
    setMessage(null)
    try {
      await onStart(
        createStartOperatorSupportBody({
          targetRepId,
          reasonCode,
          reasonNote,
        }),
      )
      setReasonCode('account_setup')
      setReasonNote('')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Support access could not be started.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      aria-labelledby={`support-access-title-${targetRepId}`}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
              Transparent support access
            </p>
            <h2
              className="mt-1 text-xl font-semibold text-slate-950"
              id={`support-access-title-${targetRepId}`}
            >
              Open {repDisplayName}&apos;s Workspace
            </h2>
          </div>
          <button
            aria-label="Close support access dialog"
            className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 disabled:opacity-50"
            disabled={saving}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-violet-200 bg-violet-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
            Confirm exact rep
          </p>
          <p className="mt-2 font-semibold text-slate-950">{repDisplayName}</p>
          <p className="mt-1 break-all text-sm text-slate-700">{repEmail}</p>
          <p className="mt-1 break-all font-mono text-xs text-slate-500">
            {targetRepId}
          </p>
        </div>

        <label className="mt-5 grid gap-1 text-sm font-semibold text-slate-800">
          Reason for access
          <select
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-normal"
            disabled={saving}
            onChange={(event) => {
              setReasonCode(event.target.value as OperatorSupportReasonCode)
              setMessage(null)
            }}
            value={reasonCode}
          >
            {OPERATOR_SUPPORT_REASONS.map((reason) => (
              <option key={reason.code} value={reason.code}>
                {reason.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 grid gap-1 text-sm font-semibold text-slate-800">
          Customer-visible support note{' '}
          <span className="font-normal text-slate-500">
            {noteRequired
              ? '(required for Other; at least 10 characters)'
              : '(optional)'}
          </span>
          <textarea
            className="min-h-28 rounded-lg border border-slate-300 p-3 font-normal"
            disabled={saving}
            maxLength={500}
            onChange={(event) => setReasonNote(event.target.value)}
            placeholder="Briefly describe what you are helping with."
            value={reasonNote}
          />
        </label>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Sparkle Suite will log this session and notify the rep before access
          opens. Billing, subscriptions, passwords, security, ownership, and
          outbound communications stay blocked.
        </div>

        {message ? (
          <p className="mt-4 text-sm font-semibold text-rose-700" role="alert">
            {message}
          </p>
        ) : null}

        <button
          className="mt-5 min-h-11 w-full rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canStart}
          onClick={submit}
          type="button"
        >
          {saving ? 'Starting secure session…' : 'Notify rep and open Workspace'}
        </button>
      </div>
    </div>
  )
}
