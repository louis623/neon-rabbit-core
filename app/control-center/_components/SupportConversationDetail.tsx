'use client'

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import { PromoteToTaskListDialog } from './PromoteToTaskListDialog'
import { SupportStatusControls } from './SupportStatusControls'
import {
  formatCommunicationDate,
  humanizeCommunicationValue,
  readCommunicationResponse,
  type OperatorConversationAttachment,
  type OperatorConversationDetail,
  type OperatorSupportReport,
} from './control-center-communications'

function formatAttachmentSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Size unavailable'
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 1024 * 1024 ? 1 : 2)} MB`
}

function SupportAttachments({
  attachments,
}: {
  attachments: OperatorConversationAttachment[]
}) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function reveal(attachment: OperatorConversationAttachment) {
    setLoadingId(attachment.id)
    setError(null)
    try {
      const response = await fetch(attachment.signedReadHref, {
        cache: 'no-store',
      })
      const body = await readCommunicationResponse(response)
      const url = typeof body.url === 'string' ? body.url : ''
      if (!url) throw new Error('The private screenshot link was not returned.')
      setUrls((current) => ({ ...current, [attachment.id]: url }))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'The private screenshot could not be opened.',
      )
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <section
      aria-labelledby="support-screenshots-heading"
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <h3 className="text-sm font-semibold text-slate-900" id="support-screenshots-heading">
        Private screenshots ({attachments.length})
      </h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Images stay private. Open links expire after five minutes.
      </p>
      <ol className="mt-3 grid gap-3 sm:grid-cols-2">
        {attachments.map((attachment) => (
          <li className="rounded-lg border border-slate-200 bg-white p-3" key={attachment.id}>
            {urls[attachment.id] ? (
              <a
                className="block"
                href={urls[attachment.id]}
                rel="noreferrer"
                target="_blank"
              >
                {/* Signed private URLs cannot be configured as stable Next Image hosts. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={`Support screenshot ${attachment.slot}`}
                  className="max-h-56 w-full rounded-md border border-slate-200 object-contain"
                  height={attachment.height}
                  src={urls[attachment.id]}
                  width={attachment.width}
                />
                <span className="mt-2 block text-xs font-semibold text-violet-700">
                  Open full size in a new tab
                </span>
              </a>
            ) : (
              <button
                className="min-h-11 w-full rounded-lg border border-violet-300 bg-violet-50 px-3 text-sm font-semibold text-violet-800 disabled:opacity-50"
                disabled={loadingId === attachment.id}
                onClick={() => void reveal(attachment)}
                type="button"
              >
                {loadingId === attachment.id
                  ? 'Opening screenshot…'
                  : `Open screenshot ${attachment.slot}`}
              </button>
            )}
            <p className="mt-2 text-xs text-slate-500">
              {attachment.width} × {attachment.height} · {formatAttachmentSize(attachment.byteSize)}
            </p>
          </li>
        ))}
      </ol>
      {error ? (
        <p className="mt-3 text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}

function snapshotText(
  snapshot: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = snapshot?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : 'Not provided'
}

function reportAuditSummary(report: OperatorSupportReport) {
  const audit = report.supportAudits?.[0]
  if (!audit) return null
  if (typeof audit.ai_summary === 'string') return audit.ai_summary
  if (typeof audit.template_summary === 'string') return audit.template_summary
  return null
}

export function SupportConversationDetail({
  detail,
  onChanged,
}: {
  detail: OperatorConversationDetail
  onChanged: () => void
}) {
  const [report, setReport] = useState(
    detail.supportReport ?? detail.conversation.supportReport ?? null,
  )
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const visibleMessages = useMemo(
    () => detail.messages.filter((entry) => !entry.isInternal),
    [detail.messages],
  )

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = reply.trim()
    if (!body) return
    setSending(true)
    setMessage(null)
    try {
      const response = await fetch(
        `/api/control-center/conversations/${detail.conversation.id}/messages`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ body, clientRequestId: crypto.randomUUID() }),
        },
      )
      await readCommunicationResponse(response)
      setReply('')
      setMessage('Reply sent as Sparkle Suite Support.')
      onChanged()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The reply was not sent.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section
      aria-labelledby="support-conversation-heading"
      className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="border-b border-slate-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
              Sparkle Suite Support
            </p>
            <h2
              className="mt-1 text-xl font-semibold text-slate-950"
              id="support-conversation-heading"
              ref={headingRef}
              tabIndex={-1}
            >
              {detail.conversation.subject}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {detail.conversation.participantLabels?.join(' · ') ||
                'Rep support conversation'}
            </p>
          </div>
          {report ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {humanizeCommunicationValue(report.status)}
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="min-w-0">
          <ol aria-label="Support conversation" className="space-y-3">
            {visibleMessages.map((entry) => {
              const fromSupport = entry.senderType === 'operator'
              return (
                <li
                  className={`rounded-xl border p-4 ${
                    fromSupport
                      ? 'ml-8 border-violet-200 bg-violet-50'
                      : 'mr-8 border-slate-200 bg-slate-50'
                  }`}
                  key={entry.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {fromSupport ? 'Sparkle Suite Support' : entry.senderLabel}
                    </p>
                    <time
                      className="text-xs text-slate-500"
                      dateTime={entry.createdAt}
                    >
                      {formatCommunicationDate(entry.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {entry.body}
                  </p>
                </li>
              )
            })}
          </ol>
          {visibleMessages.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
              No rep-visible messages are available in this thread yet.
            </p>
          ) : null}

          <form className="mt-5 border-t border-slate-200 pt-5" onSubmit={sendReply}>
            <label
              className="text-sm font-semibold text-slate-900"
              htmlFor={`support-reply-${detail.conversation.id}`}
            >
              Reply as Sparkle Suite Support
            </label>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Only the text in this reply is visible to the rep. Audit findings
              and Task List notes stay private.
            </p>
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              id={`support-reply-${detail.conversation.id}`}
              maxLength={10000}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Write a clear, helpful reply"
              value={reply}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-sm text-slate-600">
                {message}
              </p>
              <button
                className="min-h-11 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={sending || reply.trim().length === 0}
                type="submit"
              >
                {sending ? 'Sending…' : 'Send reply'}
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-4" aria-label="Private support context">
          {detail.attachments?.length ? (
            <SupportAttachments attachments={detail.attachments} />
          ) : null}
          {report ? (
            <>
              <SupportStatusControls
                onUpdated={(updated) => {
                  setReport(updated)
                  onChanged()
                }}
                report={report}
              />
              <PromoteToTaskListDialog
                onPromoted={(taskId) => {
                  setReport((current) =>
                    current ? { ...current, taskId } : current,
                  )
                  onChanged()
                }}
                report={report}
              />
              <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                  Private report and account context
                </summary>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Report type
                    </dt>
                    <dd className="mt-1 font-medium">
                      {humanizeCommunicationValue(report.reportType)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Workspace area
                    </dt>
                    <dd className="mt-1 font-medium">
                      {report.pageOrWorkflow || 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Rep
                    </dt>
                    <dd className="mt-1 font-medium">
                      {snapshotText(report.clientSnapshot, 'clientName')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Show
                    </dt>
                    <dd className="mt-1 font-medium">
                      {snapshotText(report.clientSnapshot, 'showName')}
                    </dd>
                  </div>
                </dl>
                {report.details ? (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Original details
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {report.details}
                    </p>
                  </div>
                ) : null}
              </details>
              <details className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-amber-950">
                  Private Support Auditor guidance
                </summary>
                <p className="mt-3 text-sm leading-6 text-amber-950">
                  {reportAuditSummary(report) ||
                    'Support Auditor guidance is not available yet.'}
                </p>
              </details>
            </>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              This Support conversation is missing its linked report. Reply and
              Task List promotion are unavailable until it is reconciled.
            </p>
          )}
        </aside>
      </div>
    </section>
  )
}
