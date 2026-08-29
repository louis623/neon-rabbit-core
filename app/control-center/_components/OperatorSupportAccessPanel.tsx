'use client'

import { ExternalLink, History, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  OperatorSupportHistory,
  type OperatorSupportSession,
} from './OperatorSupportHistory'
import {
  OperatorSupportStartDialog,
  type StartOperatorSupportInput,
} from './OperatorSupportStartDialog'

type SupportSessionsResponse = {
  sessions?: unknown
  activeSession?: unknown
  session?: unknown
  workspaceUrl?: unknown
  error?: unknown
  message?: unknown
}

const BLOCKING_SESSION_STATUSES = new Set(['pending_notice', 'active'])
const SUPPORT_SESSION_STATUSES = new Set([
  'pending_notice',
  'active',
  'ended',
  'expired',
  'revoked',
  'failed',
])

function isSupportSession(value: unknown): value is OperatorSupportSession {
  if (!value || typeof value !== 'object') return false
  const session = value as Record<string, unknown>
  return (
    typeof session.id === 'string' &&
    typeof session.targetRepId === 'string' &&
    typeof session.operatorDisplayName === 'string' &&
    typeof session.targetRepDisplayName === 'string' &&
    typeof session.reasonCode === 'string' &&
    typeof session.status === 'string' &&
    SUPPORT_SESSION_STATUSES.has(session.status) &&
    typeof session.createdAt === 'string'
  )
}

export function selectTargetSupportSessions(
  sessions: unknown,
  targetRepId: string,
) {
  return Array.isArray(sessions)
    ? sessions.filter(
        (session): session is OperatorSupportSession =>
          isSupportSession(session) && session.targetRepId === targetRepId,
      )
    : []
}

export function buildOperatorPublicSiteHref({
  customDomain,
  publicSiteSlug,
}: {
  customDomain?: string | null
  publicSiteSlug?: string | null
}) {
  const domain = customDomain?.trim()
  if (domain) {
    const candidate = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`
    try {
      const url = new URL(candidate)
      if (['http:', 'https:'].includes(url.protocol)) return url.toString()
    } catch {
      // Fall back to the known same-origin public slug below.
    }
  }

  const slug = publicSiteSlug?.trim().toLowerCase()
  return slug ? `/${encodeURIComponent(slug)}` : null
}

export function normalizeSupportWorkspaceUrl(
  value: unknown,
  origin = 'https://www.yoursparklesuite.com',
) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value, origin)
    const expectedOrigin = new URL(origin).origin
    if (
      url.origin !== expectedOrigin ||
      !url.pathname.startsWith('/control-center/support/')
    ) {
      return null
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

async function readSupportSessionsResponse(response: Response) {
  let body: SupportSessionsResponse = {}
  try {
    body = (await response.json()) as SupportSessionsResponse
  } catch {
    if (!response.ok) {
      throw new Error('Support access returned an unreadable error response.')
    }
  }

  if (!response.ok) {
    const apiMessage =
      typeof body.error === 'string'
        ? body.error
        : typeof body.message === 'string'
          ? body.message
          : null
    throw new Error(apiMessage ?? 'Support access could not be verified.')
  }
  return body
}

function newestFirst(sessions: OperatorSupportSession[]) {
  return [...sessions].sort((a, b) => {
    const aTime = new Date(a.startedAt ?? a.createdAt).getTime()
    const bTime = new Date(b.startedAt ?? b.createdAt).getTime()
    return bTime - aTime
  })
}

export async function requestTargetSupportSessions(
  targetRepId: string,
  fetchImpl: typeof fetch = fetch,
) {
  const response = await fetchImpl(
    `/api/control-center/support-sessions?targetRepId=${encodeURIComponent(targetRepId)}`,
    {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    },
  )
  const body = await readSupportSessionsResponse(response)
  const sessions = selectTargetSupportSessions(body.sessions, targetRepId)
  const declaredActive =
    isSupportSession(body.activeSession) &&
    body.activeSession.targetRepId === targetRepId
      ? body.activeSession
      : null
  const inferredActive =
    sessions.find((session) => BLOCKING_SESSION_STATUSES.has(session.status)) ??
    null

  return {
    sessions: newestFirst(sessions),
    activeSession: declaredActive ?? inferredActive,
  }
}

export async function createOperatorSupportSession(
  input: StartOperatorSupportInput,
  fetchImpl: typeof fetch = fetch,
) {
  const response = await fetchImpl('/api/control-center/support-sessions', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  const body = await readSupportSessionsResponse(response)
  if (
    !isSupportSession(body.session) ||
    body.session.targetRepId !== input.targetRepId
  ) {
    throw new Error('The new support session could not be confirmed.')
  }

  return {
    session: body.session,
    workspaceUrl: body.workspaceUrl ?? body.session.workspaceUrl,
  }
}

export function OperatorSupportAccessPanel({
  customDomain,
  publicSiteSlug,
  repDisplayName,
  repEmail,
  targetRepId,
}: {
  customDomain?: string | null
  publicSiteSlug?: string | null
  repDisplayName: string
  repEmail: string
  targetRepId: string
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sessions, setSessions] = useState<OperatorSupportSession[]>([])
  const [activeSession, setActiveSession] =
    useState<OperatorSupportSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [openWorkspaceHref, setOpenWorkspaceHref] = useState<string | null>(null)
  const panelRef = useRef<HTMLElement>(null)
  const startButtonRef = useRef<HTMLButtonElement>(null)
  const publicSiteHref = buildOperatorPublicSiteHref({
    customDomain,
    publicSiteSlug,
  })

  const loadSessions = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const result = await requestTargetSupportSessions(targetRepId)
      setSessions(result.sessions)
      setActiveSession(result.activeSession)
      setOpenWorkspaceHref(
        normalizeSupportWorkspaceUrl(
          result.activeSession?.workspaceUrl,
          window.location.origin,
        ),
      )
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Support access history could not be loaded.',
      )
    } finally {
      setLoading(false)
    }
  }, [targetRepId])

  useEffect(() => {
    const profile = panelRef.current?.closest('details')
    const loadWhenVisible = () => {
      if (!profile || profile.open) void loadSessions()
    }

    loadWhenVisible()
    profile?.addEventListener('toggle', loadWhenVisible)
    window.addEventListener('focus', loadWhenVisible)
    return () => {
      profile?.removeEventListener('toggle', loadWhenVisible)
      window.removeEventListener('focus', loadWhenVisible)
    }
  }, [loadSessions])

  async function startSupport(input: StartOperatorSupportInput) {
    const pendingWindow = window.open('', '_blank')
    if (pendingWindow) {
      pendingWindow.opener = null
      pendingWindow.document.title = 'Opening secure support access…'
    }

    try {
      const result = await createOperatorSupportSession(input)
      const workspaceHref = normalizeSupportWorkspaceUrl(
        result.workspaceUrl,
        window.location.origin,
      )
      if (!workspaceHref) {
        setSessions((current) =>
          newestFirst([
            result.session,
            ...current.filter((item) => item.id !== result.session.id),
          ]),
        )
        setActiveSession(result.session)
        setOpenWorkspaceHref(null)
        setDialogOpen(false)
        throw new Error('The secure support Workspace link was not valid.')
      }

      const session = { ...result.session, workspaceUrl: workspaceHref }
      setSessions((current) =>
        newestFirst([session, ...current.filter((item) => item.id !== session.id)]),
      )
      setActiveSession(session)
      setOpenWorkspaceHref(workspaceHref)
      setDialogOpen(false)

      if (pendingWindow) {
        pendingWindow.location.replace(workspaceHref)
      }
    } catch (error) {
      pendingWindow?.close()
      throw error
    }
  }

  return (
    <section
      className="rounded-lg border border-violet-200 bg-white p-4 shadow-sm lg:col-span-2"
      ref={panelRef}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="h-5 w-5 text-violet-700" />
            <h3 className="text-base font-semibold text-slate-950">
              Transparent support access
            </h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Work in this rep&apos;s account without their password. Every session
            is time-limited, logged, visibly labeled, and disclosed to the rep
            in Message Center.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {publicSiteHref ? (
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              href={publicSiteHref}
              rel="noreferrer"
              target="_blank"
            >
              Open customer site
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          ) : (
            <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-500">
              Customer site unavailable
            </span>
          )}
          <button
            className="min-h-11 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={loading || Boolean(loadError) || Boolean(activeSession)}
            onClick={() => setDialogOpen(true)}
            ref={startButtonRef}
            type="button"
          >
            {activeSession ? 'Support session already open' : 'Open Workspace as Support'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500" role="status">
          Checking secure access history…
        </p>
      ) : loadError ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-800" role="alert">
            {loadError}
          </p>
          <p className="mt-1 text-sm text-rose-700">
            Access stays disabled until Sparkle Suite can verify that another
            support session is not already active.
          </p>
          <button
            className="mt-3 min-h-11 rounded-lg border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-800"
            onClick={() => void loadSessions()}
            type="button"
          >
            Retry verification
          </button>
        </div>
      ) : activeSession ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            {activeSession.status === 'pending_notice'
              ? 'Sparkle Suite is verifying the rep notification.'
              : `Support access is active for ${activeSession.targetRepDisplayName}.`}
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            Reason: {activeSession.reasonCode.replaceAll('_', ' ')}
          </p>
          {openWorkspaceHref && activeSession.status === 'active' ? (
            <a
              className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white"
              href={openWorkspaceHref}
              rel="noreferrer"
              target="_blank"
            >
              Return to support Workspace
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      ) : null}

      {!loading && !loadError ? (
        <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-800 marker:hidden">
            <History aria-hidden="true" className="h-4 w-4 text-slate-500" />
            Access history ({sessions.length})
          </summary>
          <div className="border-t border-slate-200 p-3">
            <OperatorSupportHistory sessions={sessions} />
          </div>
        </details>
      ) : null}

      <OperatorSupportStartDialog
        onClose={() => {
          setDialogOpen(false)
          window.setTimeout(() => startButtonRef.current?.focus(), 0)
        }}
        onStart={startSupport}
        open={dialogOpen}
        repDisplayName={repDisplayName}
        repEmail={repEmail}
        targetRepId={targetRepId}
      />
    </section>
  )
}
