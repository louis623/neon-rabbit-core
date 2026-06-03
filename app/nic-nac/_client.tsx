'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  DefaultChatTransport,
  type UIMessage,
} from 'ai'
import { DashboardPlaceholder } from './components/DashboardPlaceholder'
import { NicNacChatBody } from './components/NicNacChatBody'
import { NicNacColumn } from './components/NicNacColumn'
import { NicNacGlyph } from './components/NicNacGlyph'
import { NicNacMobileShell } from './components/NicNacMobileShell'
import {
  CheckoutRequiredHome,
  RequiredSetupHome,
} from './components/RequiredSetupHome'
import {
  buildConversationStateUrl,
  getConversationIdFromSearch,
  putConversationIdInSearch,
  readJsonResponse,
} from '@/lib/nic-nac/client-conversation-routing'
import {
  shouldStartNicNacRollover,
  type NicNacConversationRunHealth,
} from '@/lib/nic-nac/rollover'
import { resolveNicNacWorkspaceMode } from '@/lib/nic-nac/required-setup-client-mode'
import type { RequiredSetupState } from '@/lib/self-serve/required-setup'
import shellStyles from './_shell.module.css'

const STORAGE_KEY = 'nic_nac_last_conversation'
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'
const SETUP_STATE_TIMEOUT_MS = 10_000
const CHECKOUT_SYNC_TIMEOUT_MS = 15_000

function newConversationId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function getInitialDesktopMatch() {
  return true
}

type ConversationHydrateResponse = {
  conversationId?: string
  messages?: UIMessage[]
  runHealth?: NicNacConversationRunHealth
}

type ConversationRolloverResponse = {
  conversationId?: string
  messages?: UIMessage[]
}

type SetupStateResponse = {
  state?: RequiredSetupState
  error?: string
}

type CheckoutResponse = {
  url?: string | null
  error?: string
}

type StripeSyncResponse = {
  synced?: boolean
  error?: string
}

type ReviewerCheckoutResponse = {
  ok?: boolean
  next?: string
  error?: string
}

export default function NicNacClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const wantsCheckout = searchParams.get('onboarding') === 'checkout-required'
  const wantsRequiredSetup = searchParams.get('onboarding') === 'required-setup'
  const billingState = searchParams.get('billing')
  const checkoutSessionId = searchParams.get('session_id')?.trim() ?? ''
  const reviewerToken = searchParams.get('review')?.trim() ?? ''
  const isFinalizingCheckout =
    wantsRequiredSetup &&
    billingState === 'subscription-success' &&
    checkoutSessionId.length > 0

  const [setupState, setSetupState] = useState<RequiredSetupState | null>(null)
  const [setupStateStatus, setSetupStateStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading')
  const [setupStateError, setSetupStateError] = useState<string | null>(null)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [reviewerCheckoutBusy, setReviewerCheckoutBusy] = useState(false)
  const [reviewerCheckoutError, setReviewerCheckoutError] = useState<string | null>(
    null,
  )

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [historyState, setHistoryState] = useState<{
    conversationId: string | null
    messages: UIMessage[] | null
    error: string | null
  }>({
    conversationId: null,
    messages: null,
    error: null,
  })
  // Distinct from initLoadError: this fires when /latest itself fails (5xx /
  // network). We deliberately do NOT fall through to a fresh UUID here —
  // that would silently fork the rep onto a new conversation and re-create
  // the cross-device drift bug this whole change is fixing.
  const [initResolveError, setInitResolveError] = useState<string | null>(null)
  const [resolveAttempt, setResolveAttempt] = useState(0)
  const [isDesktop, setIsDesktop] = useState(getInitialDesktopMatch)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)
  // Lifted from the chat body so "New conversation" can disable correctly
  // without a context dance. The chat body pushes streaming/HITL state up.
  const [chatState, setChatState] = useState<{
    isStreaming: boolean
    hasPendingApproval: boolean
  }>({ isStreaming: false, hasPendingApproval: false })
  const chatStateRef = useRef(chatState)
  const [rolloverInFlight, setRolloverInFlight] = useState(false)
  const rolloverInFlightRef = useRef(false)
  const wasStreamingRef = useRef(false)

  const loadSetupState = useCallback(
    async (options: { signal?: AbortSignal; showLoading?: boolean } = {}) => {
      if (options.showLoading) setSetupStateStatus('loading')
      setSetupStateError(null)
      const controller = new AbortController()
      const abortFromCaller = () => controller.abort('caller')
      if (options.signal?.aborted) controller.abort('caller')
      options.signal?.addEventListener('abort', abortFromCaller, { once: true })
      const timeoutId = window.setTimeout(() => {
        controller.abort('timeout')
      }, SETUP_STATE_TIMEOUT_MS)

      try {
        const res = await fetch('/api/self-serve/setup-state', {
          credentials: 'include',
          signal: controller.signal,
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | SetupStateResponse
            | null
          setSetupState(null)
          setSetupStateError(body?.error ?? `Couldn't load setup state (${res.status}).`)
          setSetupStateStatus('error')
          return
        }
        const body = await readJsonResponse<SetupStateResponse>(
          res,
          'required setup state',
        )
        setSetupState(body.state ?? null)
        setSetupStateStatus('ready')
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') {
          if (controller.signal.reason === 'timeout') {
            setSetupState(null)
            setSetupStateError(
              'Setup state did not load. Check local auth and environment configuration, then refresh.',
            )
            setSetupStateStatus('error')
          }
          return
        }
        setSetupState(null)
        setSetupStateError(`Failed to load setup state: ${(err as Error).message}`)
        setSetupStateStatus('error')
      } finally {
        window.clearTimeout(timeoutId)
        options.signal?.removeEventListener('abort', abortFromCaller)
      }
    },
    [],
  )

  const syncReturnedCheckoutSession = useCallback(
    async (sessionId: string, signal?: AbortSignal) => {
      const controller = new AbortController()
      const abortFromCaller = () => controller.abort('caller')
      if (signal?.aborted) controller.abort('caller')
      signal?.addEventListener('abort', abortFromCaller, { once: true })
      const timeoutId = window.setTimeout(() => {
        controller.abort('timeout')
      }, CHECKOUT_SYNC_TIMEOUT_MS)

      try {
        const res = await fetch('/api/stripe/sync', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId }),
          signal: controller.signal,
        })
        if (res.ok) return

        const body = (await res.json().catch(() => null)) as
          | StripeSyncResponse
          | null
        throw new Error(body?.error ?? `Stripe checkout sync failed (${res.status}).`)
      } catch (err) {
        if (controller.signal.reason === 'timeout') {
          throw new Error(
            'Stripe checkout sync did not finish. Check Stripe and Supabase configuration, then refresh.',
          )
        }
        throw err
      } finally {
        window.clearTimeout(timeoutId)
        signal?.removeEventListener('abort', abortFromCaller)
      }
    },
    [],
  )

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      if (isFinalizingCheckout) {
        setSetupStateStatus('loading')
        setSetupStateError(null)
        try {
          await syncReturnedCheckoutSession(checkoutSessionId, controller.signal)
        } catch (err) {
          if ((err as { name?: string })?.name === 'AbortError') return
          setSetupState(null)
          setSetupStateError(
            err instanceof Error
              ? err.message
              : 'Stripe checkout sync failed.',
          )
          setSetupStateStatus('error')
          return
        }
      }
      await loadSetupState({ signal: controller.signal, showLoading: true })
    })()
    return () => {
      controller.abort()
    }
  }, [
    billingState,
    checkoutSessionId,
    isFinalizingCheckout,
    loadSetupState,
    syncReturnedCheckoutSession,
    wantsRequiredSetup,
  ])

  const setupStatus = setupState?.status
  const workspaceMode = resolveNicNacWorkspaceMode({
    setupStatus,
    wantsCheckout,
    wantsRequiredSetup,
  })
  const isDashboardUnlocked = workspaceMode === 'dashboard_unlocked'
  const isRequiredSetupMode = workspaceMode === 'required_setup'
  const isCheckoutRequiredMode = workspaceMode === 'checkout_required'
  const shouldUseConversation =
    setupStateStatus === 'ready' &&
    !isCheckoutRequiredMode &&
    (isRequiredSetupMode || isDashboardUnlocked)

  useEffect(() => {
    const wasStreaming = wasStreamingRef.current
    wasStreamingRef.current = chatState.isStreaming
    if (!wasStreaming || chatState.isStreaming || !isRequiredSetupMode) return
    void loadSetupState()
  }, [chatState.isStreaming, isRequiredSetupMode, loadSetupState])

  useEffect(() => {
    chatStateRef.current = chatState
  }, [chatState])

  const activateConversation = useCallback(
    (next: string, messages?: UIMessage[]) => {
      setConversationId(next)
      if (messages) {
        setHistoryState({
          conversationId: next,
          messages,
          error: null,
        })
      }
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, next)
      const nextSearch = putConversationIdInSearch(
        new URLSearchParams(Array.from(searchParams.entries())).toString(),
        next,
      )
      router.replace(`/nic-nac?${nextSearch}`)
    },
    [router, searchParams],
  )

  const rolloverConversation = useCallback(
    async (sourceConversationId: string) => {
      const currentChatState = chatStateRef.current
      if (
        rolloverInFlightRef.current ||
        currentChatState.isStreaming ||
        currentChatState.hasPendingApproval
      ) {
        return false
      }
      rolloverInFlightRef.current = true
      setRolloverInFlight(true)
      try {
        const res = await fetch('/api/nic-nac/conversation-rollover', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ conversationId: sourceConversationId }),
        })
        if (!res.ok) return false
        const body = (await readJsonResponse(
          res,
          'conversation rollover',
        ).catch(() => null)) as
          | ConversationRolloverResponse
          | null
        if (!body?.conversationId || !body.messages) return false
        activateConversation(body.conversationId, body.messages)
        return true
      } finally {
        rolloverInFlightRef.current = false
        setRolloverInFlight(false)
      }
    },
    [activateConversation],
  )

  // Resolve conversationId via URL → /latest → fresh UUID. localStorage is
  // written for cache consistency but no longer read during init — DB is the
  // source of truth so cross-device sessions land on the same conversation.
  useEffect(() => {
    if (!shouldUseConversation) return
    const controller = new AbortController()
    let cancelled = false
    ;(async () => {
      setInitResolveError(null)
      const urlId = getConversationIdFromSearch(
        new URLSearchParams(Array.from(searchParams.entries())).toString(),
      )
      if (urlId) {
        if (cancelled) return
        setConversationId(urlId)
        if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, urlId)
        return
      }
      try {
        const res = await fetch(buildConversationStateUrl(), {
          credentials: 'include',
          signal: controller.signal,
        })
        if (cancelled) return
        if (res.status === 401) {
          // Let the history-load effect surface the auth error against
          // /conversation/[id]; it already renders "Not signed in — visit
          // /login and come back." Generate a placeholder id to advance.
          const id = newConversationId()
          setConversationId(id)
          if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id)
          return
        }
        if (!res.ok) {
          // 5xx — DO NOT fabricate a UUID. Hold the loading region with a
          // retry affordance so transient DB failures don't fork the rep.
          setInitResolveError("Couldn't load your conversation.")
          return
        }
        const body = await readJsonResponse<{ conversationId: string | null }>(
          res,
          'latest conversation',
        )
        const resolved = body?.conversationId ?? null
        const id = resolved ?? newConversationId()
        setConversationId(id)
        if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id)
        const nextSearch = putConversationIdInSearch(
          new URLSearchParams(Array.from(searchParams.entries())).toString(),
          id,
        )
        router.replace(`/nic-nac?${nextSearch}`)
      } catch (err) {
        if (cancelled) return
        if ((err as { name?: string })?.name === 'AbortError') return
        setInitResolveError("Couldn't load your conversation.")
      }
    })()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [shouldUseConversation, router, searchParams, resolveAttempt])

  useEffect(() => {
    if (!shouldUseConversation) return
    const mq = window.matchMedia(DESKTOP_MEDIA_QUERY)
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [shouldUseConversation])

  // Load persisted history once conversationId is known.
  useEffect(() => {
    if (!shouldUseConversation) return
    if (!conversationId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(buildConversationStateUrl(conversationId), {
          credentials: 'include',
        })
        if (cancelled) return
        if (res.status === 401) {
          setHistoryState({
            conversationId,
            messages: null,
            error: 'Not signed in - visit /login and come back.',
          })
          return
        }
        if (res.status === 403) {
          setHistoryState({
            conversationId,
            messages: null,
            error: 'This conversation belongs to another rep.',
          })
          return
        }
        if (!res.ok) {
          setHistoryState({
            conversationId,
            messages: null,
            error: `Couldn't load conversation history (${res.status}).`,
          })
          return
        }
        const body = await readJsonResponse<ConversationHydrateResponse>(
          res,
          'conversation history',
        )
        if (cancelled) return
        if (
          shouldStartNicNacRollover(body.runHealth) &&
          (await rolloverConversation(conversationId))
        ) {
          return
        }
        setHistoryState({
          conversationId,
          messages: (body.messages ?? []) as UIMessage[],
          error: null,
        })
      } catch (err) {
        if (cancelled) return
        setHistoryState({
          conversationId,
          messages: null,
          error: `Failed to load conversation: ${(err as Error).message}`,
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [conversationId, shouldUseConversation, rolloverConversation])

  // Desktop Escape minimizes (only if no HITL pending).
  useEffect(() => {
    if (!isDesktop || !desktopOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (chatState.hasPendingApproval) return
      // If user is typing in a textarea/input, let Escape blur instead of closing.
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) return
      e.preventDefault()
      setDesktopOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDesktop, desktopOpen, chatState.hasPendingApproval])

  const transport = useMemo(() => {
    if (!conversationId) return null
    return new DefaultChatTransport({
      api: '/api/nic-nac',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          conversationId,
          messages,
          mode: isRequiredSetupMode ? 'required_setup' : 'workspace',
        },
      }),
    })
  }, [conversationId, isRequiredSetupMode])

  const initialMessages =
    conversationId && historyState.conversationId === conversationId
      ? historyState.messages
      : null
  const initLoadError =
    conversationId && historyState.conversationId === conversationId
      ? historyState.error
      : null
  const isReady = conversationId && transport && initialMessages !== null

  // "New conversation" — rotate the id, replace URL, clear local state.
  // The chat body re-mounts via key={conversationId} so useChat resets cleanly.
  const handleNewConversation = useCallback(() => {
    if (chatState.isStreaming || chatState.hasPendingApproval) return
    activateConversation(newConversationId(), [])
  }, [activateConversation, chatState])

  const newDisabled = chatState.isStreaming || chatState.hasPendingApproval || rolloverInFlight

  const handleStartCheckout = useCallback(async () => {
    setCheckoutBusy(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          planType: 'monthly',
          agreementAccepted: true,
        }),
      })
      const body = (await res.json().catch(() => null)) as CheckoutResponse | null
      if (!res.ok || !body?.url) {
        throw new Error(body?.error ?? 'Unable to open Stripe checkout.')
      }
      window.location.href = body.url
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : 'Unable to open Stripe checkout.',
      )
      setCheckoutBusy(false)
    }
  }, [])

  const handleSimulateReviewerCheckout = useCallback(async () => {
    if (!reviewerToken) return
    setReviewerCheckoutBusy(true)
    setReviewerCheckoutError(null)

    try {
      const res = await fetch('/api/reviewer-smoke/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: reviewerToken }),
      })
      const body = (await res.json().catch(() => null)) as
        | ReviewerCheckoutResponse
        | null

      if (!res.ok || !body?.next) {
        throw new Error(
          body?.error ?? 'Reviewer checkout simulation did not finish.',
        )
      }

      const separator = body.next.includes('?') ? '&' : '?'
      window.location.href = `${body.next}${separator}review=${encodeURIComponent(reviewerToken)}`
    } catch (err) {
      setReviewerCheckoutError(
        err instanceof Error
          ? err.message
          : 'Reviewer checkout simulation did not finish.',
      )
    } finally {
      setReviewerCheckoutBusy(false)
    }
  }, [reviewerToken])

  const chatContent = isReady ? (
    <NicNacChatBody
      key={conversationId}
      conversationId={conversationId!}
      transport={transport!}
      initialMessages={initialMessages!}
      onChatStateChange={setChatState}
      onRolloverRecommended={rolloverConversation}
      resetSignal={conversationId!}
    />
  ) : initResolveError ? (
    <div className={shellStyles.loading}>
      {initResolveError}
      <button
        type="button"
        onClick={() => setResolveAttempt((n) => n + 1)}
        className={shellStyles.retryLink}
      >
        Tap to retry
      </button>
    </div>
  ) : (
    <div className={shellStyles.loading}>{initLoadError ?? 'Loading…'}</div>
  )

  if (isCheckoutRequiredMode) {
    return (
      <div className={`${shellStyles.root} ${shellStyles.setupRoot}`}>
        <CheckoutRequiredHome
          busy={checkoutBusy}
          error={checkoutError}
          onStartCheckout={handleStartCheckout}
          reviewerMode={reviewerToken.length > 0}
          reviewerBusy={reviewerCheckoutBusy}
          reviewerError={reviewerCheckoutError}
          onSimulateReviewerCheckout={handleSimulateReviewerCheckout}
        />
      </div>
    )
  }

  if (isRequiredSetupMode && setupState) {
    return (
      <div className={`${shellStyles.root} ${shellStyles.setupRoot}`}>
        <RequiredSetupHome state={setupState} chat={chatContent} />
      </div>
    )
  }

  if (setupStateStatus === 'loading') {
    return (
      <div className={shellStyles.root}>
        <div className={shellStyles.loading}>
          {isFinalizingCheckout ? 'Finalizing Stripe checkout...' : 'Loading setup...'}
        </div>
      </div>
    )
  }

  if (setupStateStatus === 'error') {
    return (
      <div className={shellStyles.root}>
        <div className={shellStyles.loading}>{setupStateError}</div>
      </div>
    )
  }

  return (
    <div
      className={`${shellStyles.root} ${
        isDesktop && !desktopOpen ? shellStyles.rootMinimized : ''
      }`}
    >
      <DashboardPlaceholder />
      {isDesktop ? (
        desktopOpen ? (
          <NicNacColumn
            variant="desktop"
            onClose={() => setDesktopOpen(false)}
            onNewConversation={handleNewConversation}
            newConversationDisabled={newDisabled}
          >
            {chatContent}
          </NicNacColumn>
        ) : (
          <button
            type="button"
            className={shellStyles.desktopReopen}
            onClick={() => setDesktopOpen(true)}
            aria-label="Open Nic-Nac"
          >
            <NicNacGlyph size={26} />
          </button>
        )
      ) : (
        <NicNacMobileShell
          open={mobileOpen}
          onOpen={() => setMobileOpen(true)}
          onClose={() => setMobileOpen(false)}
        >
          <NicNacColumn
            variant="mobile"
            onClose={() => setMobileOpen(false)}
            onNewConversation={handleNewConversation}
            newConversationDisabled={newDisabled}
          >
            {chatContent}
          </NicNacColumn>
        </NicNacMobileShell>
      )}
    </div>
  )
}
