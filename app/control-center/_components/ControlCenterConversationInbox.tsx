'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { SupportConversationDetail } from './SupportConversationDetail'
import {
  formatCommunicationDate,
  humanizeCommunicationValue,
  readCommunicationResponse,
  type OperatorConversationDetail,
  type OperatorConversationSummary,
} from './control-center-communications'

export function ControlCenterConversationInbox({
  initialConversationId,
}: {
  initialConversationId?: string
}) {
  const [conversations, setConversations] = useState<
    OperatorConversationSummary[]
  >([])
  const [activeId, setActiveId] = useState(initialConversationId ?? '')
  const [detail, setDetail] = useState<OperatorConversationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('active')
  const detailRequestRef = useRef(0)

  const loadConversations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ type: 'support', limit: '100' })
      const response = await fetch(
        `/api/control-center/conversations?${params.toString()}`,
        { cache: 'no-store' },
      )
      const body = await readCommunicationResponse(response)
      const next = Array.isArray(body.conversations)
        ? (body.conversations as OperatorConversationSummary[])
        : []
      const filtered =
        status === 'active'
          ? next.filter((entry) =>
              ['open', 'reviewing', 'planned', 'resolved'].includes(
                entry.supportReport?.status ?? '',
              ),
            )
          : next
      setConversations(filtered)
      setActiveId((current) =>
        current && filtered.some((entry) => entry.id === current)
          ? current
          : (filtered[0]?.id ?? ''),
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Support conversations could not be loaded.',
      )
    } finally {
      setLoading(false)
    }
  }, [status])

  const loadDetail = useCallback(async (conversationId: string) => {
    const requestId = ++detailRequestRef.current
    if (!conversationId) {
      setDetail(null)
      return
    }
    setLoadingDetail(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/control-center/conversations/${conversationId}`,
        { cache: 'no-store' },
      )
      const body = await readCommunicationResponse(response)
      if (requestId !== detailRequestRef.current) return
      setDetail(body.detail as OperatorConversationDetail)
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      )
    } catch (loadError) {
      if (requestId !== detailRequestRef.current) return
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'The support conversation could not be loaded.',
      )
    } finally {
      if (requestId === detailRequestRef.current) setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    void loadDetail(activeId)
  }, [activeId, loadDetail])

  const visibleConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return conversations
    return conversations.filter((conversation) =>
      [
        conversation.subject,
        conversation.participantLabels?.join(' '),
        conversation.supportReport?.title,
        conversation.supportReport?.reportType,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )
  }, [conversations, query])

  async function refreshActive() {
    await Promise.all([loadConversations(), loadDetail(activeId)])
  }

  return (
    <main className="control-center-surface min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
              Sparkle Suite Control Center
            </p>
            <h1 className="mt-1 text-3xl font-semibold">Support Inbox</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Reply to rep questions, review problems and ideas, update truthful
              statuses, and deliberately promote approved work to the Task List.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-violet-700 hover:text-violet-900"
            href="/control-center"
          >
            Back to Control Center
          </Link>
        </header>

        {error ? (
          <div
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
            role="alert"
          >
            {error}{' '}
            <button
              className="font-bold underline"
              onClick={() => void loadConversations()}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section
            aria-labelledby="support-inbox-list-heading"
            className="h-fit rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 p-4">
              <h2 className="font-semibold" id="support-inbox-list-heading">
                Rep support conversations
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] xl:grid-cols-1">
                <label className="sr-only" htmlFor="support-inbox-search">
                  Search support conversations
                </label>
                <input
                  className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
                  id="support-inbox-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search rep, subject, or type"
                  value={query}
                />
                <label className="sr-only" htmlFor="support-inbox-status">
                  Show support conversations
                </label>
                <select
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  id="support-inbox-status"
                  onChange={(event) => setStatus(event.target.value)}
                  value={status}
                >
                  <option value="active">Active</option>
                  <option value="all">All conversations</option>
                </select>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {loading ? (
                <p className="p-5 text-sm text-slate-500" role="status">
                  Loading Support Inbox…
                </p>
              ) : null}
              {!loading && visibleConversations.length === 0 ? (
                <p className="p-5 text-sm leading-6 text-slate-500">
                  No matching support conversations. New rep questions,
                  problems, and ideas will appear here.
                </p>
              ) : null}
              <ol className="divide-y divide-slate-100">
                {visibleConversations.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      aria-current={activeId === conversation.id ? 'true' : undefined}
                      className={`min-h-24 w-full p-4 text-left transition ${
                        activeId === conversation.id
                          ? 'bg-violet-50'
                          : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setActiveId(conversation.id)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-violet-700">
                          {humanizeCommunicationValue(
                            conversation.supportReport?.reportType ?? 'support',
                          )}
                        </span>
                        <time
                          className="text-xs text-slate-500"
                          dateTime={conversation.updatedAt}
                        >
                          {formatCommunicationDate(conversation.updatedAt)}
                        </time>
                      </div>
                      <span className="mt-2 block font-semibold text-slate-950">
                        {conversation.subject}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm text-slate-600">
                        {conversation.latestMessagePreview ||
                          conversation.participantLabels?.join(' · ') ||
                          'Open support conversation'}
                      </span>
                      {conversation.unreadCount ? (
                        <span className="mt-2 block text-xs font-semibold text-rose-700">
                          {conversation.unreadCount} unread
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {loadingDetail ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
              Loading conversation…
            </section>
          ) : detail ? (
            <SupportConversationDetail
              detail={detail}
              key={detail.conversation.id}
              onChanged={refreshActive}
            />
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
              Select a support conversation to review it.
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
