'use client'

import { useState } from 'react'

import {
  humanizeCommunicationValue,
  readCommunicationResponse,
  type OperatorSupportReport,
} from './control-center-communications'

const supportStatuses = [
  ['open', 'Received'],
  ['reviewing', 'Under review'],
  ['planned', 'Planned'],
  ['resolved', 'Resolved'],
  ['closed', 'Closed'],
] as const

export function SupportStatusControls({
  report,
  onUpdated,
}: {
  report: OperatorSupportReport
  onUpdated: (report: OperatorSupportReport) => void
}) {
  const [status, setStatus] = useState(report.status)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [resolution, setResolution] = useState({
    affectedArea: report.pageOrWorkflow || 'Workspace',
    symptom: report.details || report.title,
    rootCause: '',
    fixOrWorkaround: '',
    tags: '',
    approvedForReuse: false,
  })
  const resolutionComplete =
    resolution.affectedArea.trim().length >= 2 &&
    resolution.symptom.trim().length >= 10 &&
    resolution.rootCause.trim().length >= 5 &&
    resolution.fixOrWorkaround.trim().length >= 5

  async function saveStatus() {
    if (status === report.status) return
    if (
      status === 'closed' &&
      !window.confirm(
        'Close this support conversation? The rep will need to start a new support message to continue.',
      )
    ) {
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch(
        `/api/control-center/support-reports/${report.id}/status`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            status,
            ...(status === 'resolved'
              ? {
                  affectedArea: resolution.affectedArea,
                  symptom: resolution.symptom,
                  rootCause: resolution.rootCause,
                  fixOrWorkaround: resolution.fixOrWorkaround,
                  tags: resolution.tags
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                  approvedForReuse: resolution.approvedForReuse,
                }
              : {}),
          }),
        },
      )
      const body = await readCommunicationResponse(response)
      const updated = body.report
        ? (body.report as OperatorSupportReport)
        : { ...report, status }
      onUpdated(updated)
      setMessage(`Status changed to ${humanizeCommunicationValue(status)}.`)
    } catch (error) {
      setStatus(report.status)
      setMessage(
        error instanceof Error ? error.message : 'The status could not be saved.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-950">Rep-visible status</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        A truthful status update is added to the rep’s conversation. Private
        notes and audit findings remain internal.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`support-status-${report.id}`}>
          Support status
        </label>
        <select
          className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          id={`support-status-${report.id}`}
          onChange={(event) =>
            setStatus(event.target.value as OperatorSupportReport['status'])
          }
          value={status}
        >
          {supportStatuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={
            saving ||
            status === report.status ||
            (status === 'resolved' && !resolutionComplete)
          }
          onClick={saveStatus}
          type="button"
        >
          {saving ? 'Saving…' : 'Update status'}
        </button>
      </div>
      {status === 'resolved' && report.status !== 'resolved' ? (
        <div className="mt-4 grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-950">
            Resolution lesson
          </p>
          <p className="text-xs leading-5 text-emerald-900">
            These fields are private operator context. The rep sees only the
            Resolved status unless you send a separate reply.
          </p>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-emerald-950">
            Affected area
            <input
              className="min-h-11 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-normal normal-case text-slate-900"
              onChange={(event) =>
                setResolution((current) => ({ ...current, affectedArea: event.target.value }))
              }
              required
              value={resolution.affectedArea}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-emerald-950">
            Symptom
            <textarea
              className="min-h-20 rounded-lg border border-emerald-200 bg-white p-3 text-sm font-normal normal-case text-slate-900"
              onChange={(event) =>
                setResolution((current) => ({ ...current, symptom: event.target.value }))
              }
              required
              value={resolution.symptom}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-emerald-950">
            Root cause
            <textarea
              className="min-h-20 rounded-lg border border-emerald-200 bg-white p-3 text-sm font-normal normal-case text-slate-900"
              onChange={(event) =>
                setResolution((current) => ({ ...current, rootCause: event.target.value }))
              }
              required
              value={resolution.rootCause}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-emerald-950">
            Fix or workaround
            <textarea
              className="min-h-20 rounded-lg border border-emerald-200 bg-white p-3 text-sm font-normal normal-case text-slate-900"
              onChange={(event) =>
                setResolution((current) => ({ ...current, fixOrWorkaround: event.target.value }))
              }
              required
              value={resolution.fixOrWorkaround}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-emerald-950">
            Tags <span className="font-normal normal-case">(comma separated)</span>
            <input
              className="min-h-11 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-normal normal-case text-slate-900"
              onChange={(event) =>
                setResolution((current) => ({ ...current, tags: event.target.value }))
              }
              value={resolution.tags}
            />
          </label>
          <label className="flex gap-3 text-sm text-emerald-950">
            <input
              checked={resolution.approvedForReuse}
              onChange={(event) =>
                setResolution((current) => ({
                  ...current,
                  approvedForReuse: event.target.checked,
                }))
              }
              type="checkbox"
            />
            Approve this private lesson for future Support Auditor reuse.
          </label>
        </div>
      ) : null}
      <p aria-live="polite" className="mt-2 text-sm text-slate-600">
        {message}
      </p>
    </section>
  )
}
