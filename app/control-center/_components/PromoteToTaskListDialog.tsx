'use client'

import { useEffect, useRef, useState } from 'react'

import { BUG_HUNT_ITEM_TYPES, BUG_HUNT_PRIORITIES, type BugHuntPriority, type BugHuntItemType } from '@/lib/control-center/bug-hunt'

import {
  humanizeCommunicationValue,
  readCommunicationResponse,
  type OperatorSupportReport,
} from './control-center-communications'

function defaultTaskType(reportType: string): BugHuntItemType {
  return ['idea', 'suggested_upgrade', 'workflow_idea'].includes(reportType)
    ? 'update'
    : 'bug'
}

export function PromoteToTaskListDialog({
  report,
  onPromoted,
}: {
  report: OperatorSupportReport
  onPromoted: (taskId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(report.title)
  const [itemType, setItemType] = useState<BugHuntItemType>(() =>
    defaultTaskType(report.reportType),
  )
  const [priority, setPriority] = useState<BugHuntPriority>('medium')
  const [owner, setOwner] = useState('')
  const [notes, setNotes] = useState('')
  const [markPlanned, setMarkPlanned] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeButtonRef.current?.focus()

    function keepFocusInDialog(event: KeyboardEvent) {
      if (event.key !== 'Tab') return
      const dialog = closeButtonRef.current?.closest('[role="dialog"]')
      if (!(dialog instanceof HTMLElement)) return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
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

    document.addEventListener('keydown', keepFocusInDialog)
    return () => document.removeEventListener('keydown', keepFocusInDialog)
  }, [open])

  function close() {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  async function promote() {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch(
        `/api/control-center/support-reports/${report.id}/promote-task`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title,
            itemType,
            priority,
            owner: owner || undefined,
            notes: notes || undefined,
            status: markPlanned ? 'planned' : undefined,
          }),
        },
      )
      const body = await readCommunicationResponse(response)
      const task = body.task as { id?: string }
      if (!task?.id) throw new Error('The Task List item could not be confirmed.')
      onPromoted(task.id)
      close()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'The report could not be promoted.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (report.taskId) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
        Linked to Task List item {report.taskId}
      </p>
    )
  }

  return (
    <>
      <button
        className="min-h-11 rounded-lg border border-violet-300 bg-violet-50 px-4 text-sm font-semibold text-violet-800"
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        Promote to Task List
      </button>
      {open ? (
        <div
          aria-labelledby="promote-task-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
          onKeyDown={(event) => {
            if (event.key === 'Escape') close()
          }}
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold" id="promote-task-title">
                  Promote to Task List
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Review the private task details. This does not tell the rep
                  their issue is resolved.
                </p>
              </div>
              <button
                aria-label="Close Task List dialog"
                className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold"
                onClick={close}
                ref={closeButtonRef}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-1 text-sm font-semibold">
                Task title
                <input
                  className="min-h-11 rounded-lg border border-slate-300 px-3 font-normal"
                  maxLength={240}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  value={title}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Type
                <select
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-normal"
                  onChange={(event) =>
                    setItemType(event.target.value as BugHuntItemType)
                  }
                  value={itemType}
                >
                  {BUG_HUNT_ITEM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {humanizeCommunicationValue(type)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Priority
                <select
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-normal"
                  onChange={(event) => setPriority(event.target.value as BugHuntPriority)}
                  value={priority}
                >
                  {BUG_HUNT_PRIORITIES.map((itemPriority) => (
                    <option key={itemPriority} value={itemPriority}>
                      {humanizeCommunicationValue(itemPriority)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Owner <span className="font-normal text-slate-500">(optional)</span>
                <input
                  className="min-h-11 rounded-lg border border-slate-300 px-3 font-normal"
                  maxLength={160}
                  onChange={(event) => setOwner(event.target.value)}
                  value={owner}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Private notes <span className="font-normal text-slate-500">(optional)</span>
                <textarea
                  className="min-h-28 rounded-lg border border-slate-300 p-3 font-normal"
                  maxLength={4000}
                  onChange={(event) => setNotes(event.target.value)}
                  value={notes}
                />
              </label>
              <label className="flex gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                <input
                  checked={markPlanned}
                  onChange={(event) => setMarkPlanned(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  Also change the rep-visible support status to Planned.
                </span>
              </label>
            </div>
            {message ? (
              <p className="mt-3 text-sm text-rose-700" role="alert">
                {message}
              </p>
            ) : null}
            <button
              className="mt-5 min-h-11 w-full rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving || title.trim().length < 3}
              onClick={promote}
              type="button"
            >
              {saving ? 'Promoting…' : 'Confirm promotion'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
