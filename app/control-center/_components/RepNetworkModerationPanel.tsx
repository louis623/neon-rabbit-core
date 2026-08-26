'use client'

import Link from 'next/link'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'

import {
  formatCommunicationDate,
  readCommunicationResponse,
  type OperatorConversationDetail,
  type OperatorConversationSummary,
} from './control-center-communications'

type ModerationAction =
  | 'dismiss_report'
  | 'remove_message'
  | 'close_conversation'
  | 'suspend_sender'

type MessagingSuspension = {
  repId: string
  repLabel: string
  reason: string
  suspendedAt: string
}

export function RepNetworkModerationPanel() {
  const [conversations, setConversations] = useState<
    OperatorConversationSummary[]
  >([])
  const [suspensions, setSuspensions] = useState<MessagingSuspension[]>([])
  const [activeId, setActiveId] = useState('')
  const [detail, setDetail] = useState<OperatorConversationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')
  const [action, setAction] = useState<ModerationAction>('dismiss_report')
  const [messageId, setMessageId] = useState('')
  const [reportId, setReportId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const detailRequestRef = useRef(0)

  const loadQueue = useCallback(async () => {
    setLoading(true)
    try {
      const [conversationResponse, suspensionResponse] = await Promise.all([
        fetch(
          '/api/control-center/conversations?type=rep_network&reportedOnly=true&limit=100',
          { cache: 'no-store' },
        ),
        fetch('/api/control-center/rep-messaging-suspensions', {
          cache: 'no-store',
        }),
      ])
      const [body, suspensionBody] = await Promise.all([
        readCommunicationResponse(conversationResponse),
        readCommunicationResponse(suspensionResponse),
      ])
      const next = Array.isArray(body.conversations)
        ? (body.conversations as OperatorConversationSummary[])
        : []
      setConversations(next)
      setSuspensions(
        Array.isArray(suspensionBody.suspensions)
          ? (suspensionBody.suspensions as MessagingSuspension[])
          : [],
      )
      setActiveId((current) =>
        current && next.some((entry) => entry.id === current)
          ? current
          : (next[0]?.id ?? ''),
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Safety reports could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (conversationId: string) => {
    const requestId = ++detailRequestRef.current
    if (!conversationId) {
      setDetail(null)
      return
    }
    try {
      const response = await fetch(
        `/api/control-center/conversations/${conversationId}`,
        { cache: 'no-store' },
      )
      const body = await readCommunicationResponse(response)
      if (requestId !== detailRequestRef.current) return
      setDetail(body.detail as OperatorConversationDetail)
    } catch (error) {
      if (requestId !== detailRequestRef.current) return
      setMessage(error instanceof Error ? error.message : 'The reported conversation could not be loaded.')
    }
  }, [])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  useEffect(() => {
    void loadDetail(activeId)
  }, [activeId, loadDetail])

  async function submitModeration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!detail || !reason.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch(
        `/api/control-center/conversations/${detail.conversation.id}/moderate`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action,
            reason,
            messageId:
              action === 'remove_message' || action === 'suspend_sender'
                ? messageId
                : undefined,
            reportId: action === 'dismiss_report' ? reportId : undefined,
          }),
        },
      )
      await readCommunicationResponse(response)
      setReason('')
      setMessageId('')
      setReportId('')
      setMessage('Moderation action recorded in the private audit log.')
      await loadQueue()
      await loadDetail(detail.conversation.id)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The moderation action was not saved.')
    } finally {
      setSaving(false)
    }
  }

  async function restoreMessaging(suspension: MessagingSuspension) {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch(
        '/api/control-center/rep-messaging-suspensions',
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            repId: suspension.repId,
            suspended: false,
            reason: 'Operator restored messaging access after safety review.',
          }),
        },
      )
      await readCommunicationResponse(response)
      setMessage(`Messaging restored for ${suspension.repLabel}.`)
      await loadQueue()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Messaging access could not be restored.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="control-center-surface min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
              Sparkle Suite Control Center
            </p>
            <h1 className="mt-1 text-3xl font-semibold">Network Safety</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review only rep conversations that have been reported. Actions
              require a private reason and remain in the moderation audit log.
            </p>
          </div>
          <Link className="text-sm font-semibold text-violet-700" href="/control-center">
            Back to Control Center
          </Link>
        </header>

        {message ? (
          <p
            aria-live="polite"
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
          >
            {message}
          </p>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">Messaging suspensions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Active suspensions stop new Rep Network contact without
                affecting Team or Support conversations.
              </p>
            </div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {suspensions.length} active
            </p>
          </div>
          {suspensions.length > 0 ? (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {suspensions.map((suspension) => (
                <li
                  className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={suspension.repId}
                >
                  <div>
                    <p className="text-sm font-semibold text-rose-950">
                      {suspension.repLabel}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-rose-800">
                      {suspension.reason}
                    </p>
                    <time
                      className="mt-1 block text-xs text-rose-700"
                      dateTime={suspension.suspendedAt}
                    >
                      Suspended {formatCommunicationDate(suspension.suspendedAt)}
                    </time>
                  </div>
                  <button
                    className="min-h-11 shrink-0 rounded-lg border border-rose-300 bg-white px-3 text-sm font-semibold text-rose-800 disabled:opacity-50"
                    disabled={saving}
                    onClick={() => void restoreMessaging(suspension)}
                    type="button"
                  >
                    Restore messaging
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No reps currently have Rep Network messaging suspended.
            </p>
          )}
        </section>

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="h-fit rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <h2 className="font-semibold">Reported conversations</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Ordinary private rep conversations do not appear here.
              </p>
            </div>
            {loading ? (
              <p className="p-5 text-sm text-slate-500">Loading safety queue…</p>
            ) : null}
            {!loading && conversations.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">
                No Rep Network conversations are waiting for safety review.
              </p>
            ) : null}
            <ol className="divide-y divide-slate-100">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    aria-current={activeId === conversation.id ? 'true' : undefined}
                    className={`min-h-24 w-full p-4 text-left ${
                      activeId === conversation.id ? 'bg-violet-50' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setActiveId(conversation.id)}
                    type="button"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-rose-700">
                      {conversation.reportedCount ?? 1} safety report
                      {(conversation.reportedCount ?? 1) === 1 ? '' : 's'}
                    </span>
                    <span className="mt-2 block font-semibold">{conversation.subject}</span>
                    <span className="mt-1 block text-sm text-slate-600">
                      {conversation.participantLabels?.join(' · ') || 'Rep Network'}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          {detail ? (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                  Private safety review
                </p>
                <h2 className="mt-1 text-xl font-semibold">{detail.conversation.subject}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {detail.conversation.participantLabels?.join(' · ')}
                </p>
              </header>
              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <ol aria-label="Reported conversation messages" className="space-y-3">
                  {detail.messages.filter((entry) => !entry.isInternal).map((entry) => (
                    <li className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={entry.id}>
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="text-sm font-semibold">{entry.senderLabel}</p>
                        <time className="text-xs text-slate-500" dateTime={entry.createdAt}>
                          {formatCommunicationDate(entry.createdAt)}
                        </time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {entry.body}
                      </p>
                    </li>
                  ))}
                </ol>
                <form className="h-fit rounded-xl border border-rose-200 bg-rose-50 p-4" onSubmit={submitModeration}>
                  <h3 className="text-sm font-semibold text-rose-950">Record an action</h3>
                  <label className="mt-3 grid gap-1 text-xs font-bold uppercase tracking-wide text-rose-900">
                    Action
                    <select
                      className="min-h-11 rounded-lg border border-rose-200 bg-white px-3 text-sm font-normal normal-case text-slate-900"
                      onChange={(event) => setAction(event.target.value as ModerationAction)}
                      value={action}
                    >
                      <option value="dismiss_report">Dismiss report</option>
                      <option value="remove_message">Remove reported message</option>
                      <option value="close_conversation">Close conversation</option>
                      <option value="suspend_sender">Suspend message sender</option>
                    </select>
                  </label>
                  {action === 'dismiss_report' ? (
                    <label className="mt-3 grid gap-1 text-xs font-bold uppercase tracking-wide text-rose-900">
                      Report
                      <select
                        className="min-h-11 rounded-lg border border-rose-200 bg-white px-3 text-sm font-normal normal-case text-slate-900"
                        onChange={(event) => setReportId(event.target.value)}
                        required
                        value={reportId}
                      >
                        <option value="">Choose a report</option>
                        {(detail.reports ?? []).map((report) => (
                          <option key={report.id} value={report.id}>
                            {report.reason}: {report.details?.slice(0, 60) || 'No details'}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {action === 'remove_message' || action === 'suspend_sender' ? (
                    <label className="mt-3 grid gap-1 text-xs font-bold uppercase tracking-wide text-rose-900">
                      Message
                      <select
                        className="min-h-11 rounded-lg border border-rose-200 bg-white px-3 text-sm font-normal normal-case text-slate-900"
                        onChange={(event) => setMessageId(event.target.value)}
                        required
                        value={messageId}
                      >
                        <option value="">Choose a message</option>
                        {detail.messages.filter((entry) => !entry.isInternal).map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.senderLabel}: {entry.body.slice(0, 60)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className="mt-3 grid gap-1 text-xs font-bold uppercase tracking-wide text-rose-900">
                    Private reason
                    <textarea
                      className="min-h-28 rounded-lg border border-rose-200 bg-white p-3 text-sm font-normal normal-case text-slate-900"
                      maxLength={2000}
                      onChange={(event) => setReason(event.target.value)}
                      required
                      value={reason}
                    />
                  </label>
                  <button
                    className="mt-4 min-h-11 w-full rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
                    disabled={
                      saving ||
                      !reason.trim() ||
                      ((action === 'remove_message' || action === 'suspend_sender') &&
                        !messageId) ||
                      (action === 'dismiss_report' && !reportId)
                    }
                    type="submit"
                  >
                    {saving ? 'Recording…' : 'Confirm moderation action'}
                  </button>
                </form>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
              Select a reported conversation to review it.
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
