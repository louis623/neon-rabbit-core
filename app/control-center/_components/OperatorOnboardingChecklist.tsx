'use client'

import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  OPERATOR_ONBOARDING_CHECKLIST_STATUSES,
  type OperatorOnboardingChecklistItem,
  type OperatorOnboardingChecklistStatus,
} from '@/lib/control-center/operator-onboarding-checklist'

function label(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function OperatorOnboardingChecklist({
  clientName,
  initialItems,
  repId,
}: {
  clientName: string
  initialItems: OperatorOnboardingChecklistItem[]
  repId: string
}) {
  const [items, setItems] = useState(initialItems)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const completeCount = useMemo(
    () => items.filter((item) => item.entry.status === 'complete').length,
    [items],
  )

  async function saveItem(
    item: OperatorOnboardingChecklistItem,
    status: OperatorOnboardingChecklistStatus,
    evidenceSummary: string,
  ) {
    setSavingKey(item.key)
    setMessage(null)
    try {
      const response = await fetch('/api/control-center/onboarding-checklist', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          repId,
          itemKey: item.key,
          status,
          evidenceSummary,
        }),
      })
      const body = (await response.json()) as {
        error?: string
        item?: OperatorOnboardingChecklistItem['entry']
      }
      if (!response.ok || !body.item) throw new Error(body.error ?? 'Unable to save this checklist item.')
      setItems((current) => current.map((candidate) => candidate.key === item.key ? { ...candidate, entry: body.item! } : candidate))
      setMessage(`${item.title} saved.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save this checklist item.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <details className="group/onboarding rounded-lg border border-slate-200 bg-white">
      <summary
        aria-label={`Expand ${clientName} onboarding checklist`}
        className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 marker:hidden"
      >
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Onboarding checklist</h3>
          <p className="mt-1 text-xs text-slate-600">
            Operator launch ledger · {completeCount} of {items.length} complete
          </p>
        </div>
        <ChevronDown aria-hidden="true" className="h-4 w-4 text-slate-400 transition group-open/onboarding:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-slate-100 p-4">
        <p className="text-xs leading-5 text-slate-600">
          Keep notes concise and non-sensitive. This does not store customer intake answers or replace the rep’s self-serve setup.
        </p>
        {items.map((item) => (
          <ChecklistItem key={item.key} item={item} onSave={saveItem} saving={savingKey === item.key} />
        ))}
        {message ? <p className="text-sm text-slate-700" role="status">{message}</p> : null}
      </div>
    </details>
  )
}

function ChecklistItem({
  item,
  onSave,
  saving,
}: {
  item: OperatorOnboardingChecklistItem
  onSave: (item: OperatorOnboardingChecklistItem, status: OperatorOnboardingChecklistStatus, evidenceSummary: string) => Promise<void>
  saving: boolean
}) {
  const [status, setStatus] = useState(item.entry.status)
  const [evidenceSummary, setEvidenceSummary] = useState(item.entry.evidenceSummary ?? '')

  return (
    <article className="rounded-md border border-slate-200 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">{item.title}</h4>
          <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
        </div>
        {item.optional ? <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Optional domain step</span> : null}
      </div>
      {item.guidance ? (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs leading-5 text-slate-700">
          {item.guidance.map((question) => <li key={question}>{question}</li>)}
        </ol>
      ) : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-end">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Status
          <select className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium normal-case text-slate-900" onChange={(event) => setStatus(event.target.value as OperatorOnboardingChecklistStatus)} value={status}>
            {OPERATOR_ONBOARDING_CHECKLIST_STATUSES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Safe proof note
          <input className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium normal-case text-slate-900" maxLength={1200} onChange={(event) => setEvidenceSummary(event.target.value)} placeholder="Short non-sensitive proof or follow-up" value={evidenceSummary} />
        </label>
        <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} onClick={() => void onSave(item, status, evidenceSummary)} type="button">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </article>
  )
}
