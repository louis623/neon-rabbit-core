'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type FileUIPart,
  type UIMessage,
} from 'ai'
import { Bubble } from './components/Bubble'
import { ChatHistory } from './components/ChatHistory'
import { Chips } from './components/Chips'
import { DashboardPlaceholder } from './components/DashboardPlaceholder'
import { EmptyGreeting } from './components/EmptyGreeting'
import { ErrorBlock } from './components/ErrorBlock'
import { HITLBlock } from './components/HITLBlock'
import { InputRow, type InputAttachment } from './components/InputRow'
import { StreamingBubble } from './components/StreamingBubble'
import { ThinkingIndicator } from './components/ThinkingIndicator'
import { ThumperColumn } from './components/ThumperColumn'
import { ThumperGlyph } from './components/ThumperGlyph'
import { ThumperMobileShell } from './components/ThumperMobileShell'
import { compressImage } from '@/lib/thumper/image-compress'
import {
  findActionableApproval,
  type ActionableApproval,
} from '@/lib/thumper/hitl-state'
import { mergeServerMessages } from '@/lib/nic-nac/client-message-refresh'
import shellStyles from './_shell.module.css'

const STORAGE_KEY = 'thumper_last_conversation'
const MAX_ATTACHMENTS = 10
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

function newConversationId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function newAttachmentId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function getInitialDesktopMatch() {
  if (typeof window === 'undefined') return true
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
}

interface ApprovalResponseFn {
  (args: { id: string; approved: boolean; reason?: string }): void
}

export default function ThumperClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

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
  // Lifted from ChatBody so "New conversation" can disable correctly without
  // a context dance. ChatBody pushes streaming/HITL state up via a callback.
  const [chatState, setChatState] = useState<{
    isStreaming: boolean
    hasPendingApproval: boolean
  }>({ isStreaming: false, hasPendingApproval: false })

  // Resolve conversationId via URL → /latest → fresh UUID. localStorage is
  // written for cache consistency but no longer read during init — DB is the
  // source of truth so cross-device sessions land on the same conversation.
  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    ;(async () => {
      setInitResolveError(null)
      const urlId = searchParams.get('c')
      if (urlId) {
        if (cancelled) return
        setConversationId(urlId)
        if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, urlId)
        return
      }
      try {
        const res = await fetch('/api/thumper/conversation/latest', {
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
        const body = (await res.json()) as { conversationId: string | null }
        const resolved = body?.conversationId ?? null
        const id = resolved ?? newConversationId()
        setConversationId(id)
        if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id)
        const qs = new URLSearchParams(Array.from(searchParams.entries()))
        qs.set('c', id)
        router.replace(`/nic-nac?${qs.toString()}`)
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
  }, [router, searchParams, resolveAttempt])

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Load persisted history once conversationId is known.
  useEffect(() => {
    if (!conversationId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/thumper/conversation/${conversationId}`, {
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
        const body = await res.json()
        if (cancelled) return
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
  }, [conversationId])

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
      api: '/api/thumper',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { conversationId, messages },
      }),
    })
  }, [conversationId])

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
  // ChatBody re-mounts via key={conversationId} so useChat resets cleanly.
  const handleNewConversation = useCallback(() => {
    if (chatState.isStreaming || chatState.hasPendingApproval) return
    const next = newConversationId()
    setConversationId(next)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, next)
    const qs = new URLSearchParams(Array.from(searchParams.entries()))
    qs.set('c', next)
    router.replace(`/nic-nac?${qs.toString()}`)
  }, [chatState, router, searchParams])

  const newDisabled = chatState.isStreaming || chatState.hasPendingApproval

  const chatContent = isReady ? (
    <ChatBody
      key={conversationId}
      conversationId={conversationId!}
      transport={transport!}
      initialMessages={initialMessages!}
      onChatStateChange={setChatState}
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

  return (
    <div
      className={`${shellStyles.root} ${
        isDesktop && !desktopOpen ? shellStyles.rootMinimized : ''
      }`}
    >
      <DashboardPlaceholder />
      {isDesktop ? (
        desktopOpen ? (
          <ThumperColumn
            variant="desktop"
            onClose={() => setDesktopOpen(false)}
            onNewConversation={handleNewConversation}
            newConversationDisabled={newDisabled}
          >
            {chatContent}
          </ThumperColumn>
        ) : (
          <button
            type="button"
            className={shellStyles.desktopReopen}
            onClick={() => setDesktopOpen(true)}
            aria-label="Open Nic-Nac"
          >
            <ThumperGlyph size={26} />
          </button>
        )
      ) : (
        <ThumperMobileShell
          open={mobileOpen}
          onOpen={() => setMobileOpen(true)}
          onClose={() => setMobileOpen(false)}
        >
          <ThumperColumn
            variant="mobile"
            onClose={() => setMobileOpen(false)}
            onNewConversation={handleNewConversation}
            newConversationDisabled={newDisabled}
          >
            {chatContent}
          </ThumperColumn>
        </ThumperMobileShell>
      )}
    </div>
  )
}

function ChatBody({
  conversationId,
  transport,
  initialMessages,
  onChatStateChange,
}: {
  conversationId: string
  transport: DefaultChatTransport<UIMessage>
  initialMessages: UIMessage[]
  onChatStateChange: (s: { isStreaming: boolean; hasPendingApproval: boolean }) => void
  resetSignal: string
}) {
  // Server-owned ThinkingIndicator state machine. The server emits transient
  // `data-thinking` parts with phase: 'show' | 'confirm' | 'hide'. The client
  // only owns presentation timing (150ms provisional debounce, 800ms confirmed
  // minimum). `activeMessageIdRef` outlives provisional hides so a later
  // confirm for the same message can re-show — supports preamble→tool and
  // tool→text→tool sequences.
  const [thinkingFor, setThinkingFor] = useState<string | null>(null)
  const thinkingForRef = useRef<string | null>(null)
  useEffect(() => {
    thinkingForRef.current = thinkingFor
  }, [thinkingFor])
  const activeMessageIdRef = useRef<string | null>(null)
  const confirmedRef = useRef(false)
  const shownAtRef = useRef<number | null>(null)
  const showTimerRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current !== null) {
      window.clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
  }, [])
  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const requestShow = useCallback(
    (id: string) => {
      if (activeMessageIdRef.current !== id) {
        clearShowTimer()
        clearHideTimer()
        activeMessageIdRef.current = id
        confirmedRef.current = false
        shownAtRef.current = null
        setThinkingFor(null)
      }
      if (thinkingForRef.current === id) return
      clearShowTimer()
      showTimerRef.current = window.setTimeout(() => {
        showTimerRef.current = null
        shownAtRef.current = Date.now()
        setThinkingFor(id)
      }, 150)
    },
    [clearShowTimer, clearHideTimer]
  )

  const confirmThinking = useCallback(
    (id: string) => {
      if (activeMessageIdRef.current !== id) {
        clearShowTimer()
        clearHideTimer()
        activeMessageIdRef.current = id
      }
      confirmedRef.current = true
      clearShowTimer()
      // Stamp shownAtRef so the 800ms minimum has a fresh basis when
      // upgrading from provisional → confirmed (or re-confirming after a
      // prior hide in a tool→text→tool sequence).
      shownAtRef.current = Date.now()
      if (thinkingForRef.current !== id) {
        setThinkingFor(id)
      }
    },
    [clearShowTimer, clearHideTimer]
  )

  const requestHide = useCallback(
    (id: string) => {
      if (activeMessageIdRef.current !== id) return
      clearShowTimer()
      // Not visible: cancel pending show, clear confirmation, but KEEP
      // activeMessageIdRef so a later confirm for this same id can resurrect.
      if (thinkingForRef.current !== id) {
        confirmedRef.current = false
        shownAtRef.current = null
        return
      }
      // Visible + unconfirmed: hide immediately. KEEP activeMessageIdRef.
      if (!confirmedRef.current) {
        setThinkingFor(null)
        confirmedRef.current = false
        shownAtRef.current = null
        return
      }
      // Visible + confirmed: enforce 800ms minimum from the last show.
      const elapsed = Date.now() - (shownAtRef.current ?? Date.now())
      const remaining = Math.max(0, 800 - elapsed)
      clearHideTimer()
      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null
        setThinkingFor(null)
        confirmedRef.current = false
        shownAtRef.current = null
        // activeMessageIdRef stays — supports tool-text-tool resumption.
      }, remaining)
    },
    [clearShowTimer, clearHideTimer]
  )

  const {
    messages,
    sendMessage,
    addToolApprovalResponse,
    status,
    error,
    regenerate,
    clearError,
    setMessages,
  } = useChat({
    transport,
    messages: initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onData: (dataPart) => {
      if (dataPart.type !== 'data-thinking') return
      const data = dataPart.data as {
        phase: 'show' | 'confirm' | 'hide'
        messageId: string
      }
      if (data.phase === 'show') requestShow(data.messageId)
      else if (data.phase === 'confirm') confirmThinking(data.messageId)
      else if (data.phase === 'hide') requestHide(data.messageId)
    },
  })

  const [draft, setDraft] = useState('')
  const [attachments, setAttachments] = useState<InputAttachment[]>([])
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null)
  // Per-message failure tracking for inline retry. Stores the original parts
  // so retry sends the full payload (text + images) even after attachments
  // were cleared on submit.
  const [failedMessages, setFailedMessages] = useState<
    Map<string, { parts: UIMessage['parts'] }>
  >(new Map())
  const [pendingOptimisticCreated, setPendingOptimisticCreated] = useState<{
    stamp: number
    previousLatestUserId: string | null
  } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const prevStatusRef = useRef<typeof status>(status)

  const isStreaming = status === 'streaming' || status === 'submitted'
  // Actionable only if the LAST assistant message has an approval-requested
  // part in its LAST step. Mirrors AI SDK's
  // `lastAssistantMessageIsCompleteWithApprovalResponses` — anything older
  // is historical and `addToolApprovalResponse` (which only mutates the
  // last message) can't even target it. Treating older approval-requested
  // parts as live would resurrect dead cards on reload and lock the input.
  const actionableApproval = useMemo(
    () => findActionableApproval(messages),
    [messages]
  )
  const hasPendingApproval = actionableApproval !== null

  const refreshConversationMessages = useCallback(async () => {
    if (!conversationId || status !== 'ready' || hasPendingApproval) return

    const res = await fetch(`/api/thumper/conversation/${conversationId}`, {
      credentials: 'include',
    })
    if (!res.ok) return

    const body = (await res.json().catch(() => null)) as
      | { messages?: UIMessage[] }
      | null
    if (!body?.messages) return

    setMessages((current) => mergeServerMessages(current, body.messages ?? []))
  }, [conversationId, hasPendingApproval, setMessages, status])

  useEffect(() => {
    if (!conversationId || status !== 'ready' || hasPendingApproval) return

    const refreshIfIdle = () => {
      if (document.visibilityState === 'hidden') return
      void refreshConversationMessages()
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshConversationMessages()
      }
    }

    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refreshIfIdle)
    window.addEventListener('online', refreshIfIdle)
    const intervalId = window.setInterval(refreshIfIdle, 45_000)

    return () => {
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refreshIfIdle)
      window.removeEventListener('online', refreshIfIdle)
      window.clearInterval(intervalId)
    }
  }, [conversationId, hasPendingApproval, refreshConversationMessages, status])

  // Push streaming + HITL state up so the parent can disable the New button.
  useEffect(() => {
    onChatStateChange({ isStreaming, hasPendingApproval })
  }, [isStreaming, hasPendingApproval, onChatStateChange])

  // Auto-focus input when streaming completes (ready/error transitions), and
  // fire a terminal ThinkingIndicator hide as a safety net in case the server
  // didn't (e.g. transport-level error before the finally clause ran).
  useEffect(() => {
    if (prevStatusRef.current !== status) {
      if (
        prevStatusRef.current === 'streaming' ||
        prevStatusRef.current === 'submitted'
      ) {
        textareaRef.current?.focus()
      }
      if (
        (status === 'error' || status === 'ready') &&
        activeMessageIdRef.current
      ) {
        requestHide(activeMessageIdRef.current)
      }
      prevStatusRef.current = status
    }
  }, [status, requestHide])

  const currentFailedMessage =
    status === 'error' && error ? findLatestUserMessage(messages) : null
  const displayedFailedMessages =
    currentFailedMessage && !failedMessages.has(currentFailedMessage.id)
      ? new Map(failedMessages).set(currentFailedMessage.id, {
          parts: currentFailedMessage.parts,
        })
      : failedMessages

  const hasError = !!error
  const hasMessages = messages.length > 0
  const chipsVisible = !isStreaming && !hasPendingApproval && !hasError
  const inputAriaDisabled = hasPendingApproval
  const latestUserId = findLatestUserMessageId(messages)
  const latestPendingUserId =
    pendingOptimisticCreated &&
    latestUserId &&
    latestUserId !== pendingOptimisticCreated.previousLatestUserId
      ? latestUserId
      : null

  const sendWithParts = useCallback(
    async (parts: UIMessage['parts'], replaceMessageId?: string) => {
      // Split parts into text + file payload so we hit useChat's
      // ({ text, files }) overload, which is the canonical send path.
      const textChunks: string[] = []
      const files: FileUIPart[] = []
      for (const p of parts ?? []) {
        const pt = p as {
          type?: string
          text?: string
          mediaType?: string
          url?: string
          filename?: string
        }
        if (pt.type === 'text' && typeof pt.text === 'string') {
          textChunks.push(pt.text)
        } else if (
          pt.type === 'file' &&
          typeof pt.mediaType === 'string' &&
          typeof pt.url === 'string'
        ) {
          files.push({
            type: 'file',
            mediaType: pt.mediaType,
            url: pt.url,
            ...(pt.filename ? { filename: pt.filename } : {}),
          })
        }
      }
      const text = textChunks.join('\n').trim()
      const optimisticId = replaceMessageId
      try {
        if (text && files.length > 0) {
          await sendMessage({
            text,
            files,
            ...(optimisticId ? { messageId: optimisticId } : {}),
          })
        } else if (files.length > 0) {
          await sendMessage({
            files,
            ...(optimisticId ? { messageId: optimisticId } : {}),
          })
        } else if (text) {
          await sendMessage({
            text,
            ...(optimisticId ? { messageId: optimisticId } : {}),
          })
        }
      } catch {
        // useChat surfaces error state; no rethrow needed.
      }
    },
    [sendMessage]
  )

  const handleSubmit = async () => {
    const text = draft.trim()
    if (!text && attachments.length === 0) return
    // Build canonical parts for failure-retry storage.
    const parts: UIMessage['parts'] = []
    if (text) parts.push({ type: 'text', text } as unknown as UIMessage['parts'][number])
    for (const a of attachments) {
      parts.push({
        type: 'file',
        mediaType: a.mediaType,
        url: a.dataUrl,
        width: a.width,
        height: a.height,
        blurRisk: a.blurRisk,
        lightingRisk: a.lightingRisk,
        subjectCoverage: a.subjectCoverage,
        subjectCentered: a.subjectCentered,
      } as unknown as UIMessage['parts'][number])
    }
    setDraft('')
    setAttachments([])
    setAttachmentNotice(null)
    setPendingOptimisticCreated({
      stamp: Date.now(),
      previousLatestUserId: findLatestUserMessageId(messages),
    })
    await sendWithParts(parts)
  }

  const handleChip = (text: string) => {
    if (hasPendingApproval || isStreaming) return
    void sendMessage({ text })
  }

  const handlePickFiles = async (files: FileList | null, _mode: 'gallery' | 'camera') => {
    if (!files || files.length === 0) return
    const remainingSlots = MAX_ATTACHMENTS - attachments.length
    if (remainingSlots <= 0) {
      setAttachmentNotice(`Max ${MAX_ATTACHMENTS} images per message.`)
      return
    }
    const list = Array.from(files)
    let notice: string | null = null
    if (list.length > remainingSlots) {
      notice = `Kept first ${remainingSlots} — max ${MAX_ATTACHMENTS} per message.`
    }
    const slice = list.slice(0, remainingSlots)
    const failed: string[] = []
    const accepted: InputAttachment[] = []
    await Promise.all(
      slice.map(async (file) => {
        try {
          const compressed = await compressImage(file)
          accepted.push({
            id: newAttachmentId(),
            dataUrl: compressed.dataUrl,
            mediaType: 'image/jpeg',
            width: compressed.width,
            height: compressed.height,
            blurRisk: compressed.blurRisk,
            lightingRisk: compressed.lightingRisk,
            subjectCoverage: compressed.subjectCoverage,
            subjectCentered: compressed.subjectCentered,
          })
        } catch {
          failed.push(file.name || 'image')
        }
      })
    )
    if (accepted.length > 0) {
      setAttachments((prev) => [...prev, ...accepted].slice(0, MAX_ATTACHMENTS))
    }
    if (failed.length > 0) {
      const detail = failed.length === 1 ? `Couldn't read ${failed[0]}.` : `Couldn't read ${failed.length} files.`
      notice = notice ? `${notice} ${detail}` : detail
    }
    setAttachmentNotice(notice)
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
    setAttachmentNotice(null)
  }

  const handleRetry = useCallback(
    async (messageId: string) => {
      const entry = displayedFailedMessages.get(messageId)
      if (!entry) return
      setFailedMessages((prev) => {
        const next = new Map(prev)
        next.delete(messageId)
        return next
      })
      clearError()
      // Replace the failed message in place by passing its existing id.
      await sendWithParts(entry.parts, messageId)
    },
    [displayedFailedMessages, clearError, sendWithParts]
  )

  return (
    <>
      <ChatHistory isStreaming={isStreaming}>
        {!hasMessages ? <EmptyGreeting /> : null}
        {messages.map((m, idx) => {
          const ts = readCreatedAt(
            m,
            latestPendingUserId,
            pendingOptimisticCreated?.stamp ?? null
          )
          if (m.role === 'user') {
            const failed = displayedFailedMessages.get(m.id)
            return (
              <div key={m.id}>
                <UserMessage message={m} timestamp={ts} />
                {failed ? (
                  <ErrorBlock
                    variant="inline"
                    message="Couldn't send. Try again?"
                    onRetry={() => void handleRetry(m.id)}
                  />
                ) : null}
              </div>
            )
          }
          return (
            <AssistantMessage
              key={m.id}
              message={m}
              timestamp={ts}
              isFirstInRun={isFirstThumperInRun(messages, idx)}
              isStreamingTail={isStreaming && idx === messages.length - 1}
              isThinking={thinkingFor === m.id}
              onApprove={addToolApprovalResponse}
              actionableApproval={
                actionableApproval?.messageId === m.id
                  ? actionableApproval.approval
                  : null
              }
            />
          )
        })}
        {hasError && displayedFailedMessages.size === 0 ? (
          <ErrorBlock
            variant="global"
            message="Couldn't reach Nic-Nac just now. If this keeps happening, let Louis know."
            onRetry={() => regenerate()}
          />
        ) : null}
      </ChatHistory>
      <Chips
        visible={chipsVisible}
        onPick={handleChip}
        disabled={isStreaming || hasPendingApproval}
      />
      <InputRow
        ref={textareaRef}
        value={draft}
        onChange={setDraft}
        onSubmit={() => void handleSubmit()}
        disabled={inputAriaDisabled}
        isStreaming={isStreaming}
        attachments={attachments}
        onPickFiles={handlePickFiles}
        onRemoveAttachment={handleRemoveAttachment}
        attachmentNotice={attachmentNotice}
        placeholder={hasPendingApproval ? 'Approve or cancel above…' : 'Ask Nic-Nac…'}
      />
    </>
  )
}

function readCreatedAt(
  m: UIMessage,
  latestPendingUserId: string | null,
  pendingStamp: number | null
): string | number | undefined {
  const meta = m.metadata as { created_at?: string } | undefined
  if (meta?.created_at) return meta.created_at
  return m.id === latestPendingUserId ? pendingStamp ?? undefined : undefined
}

function findLatestUserMessageId(messages: UIMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].id
  }
  return null
}

function findLatestUserMessage(
  messages: UIMessage[]
): { id: string; parts: UIMessage['parts'] } | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return { id: messages[i].id, parts: messages[i].parts ?? [] }
    }
  }
  return null
}

function isFirstThumperInRun(messages: UIMessage[], idx: number): boolean {
  if (messages[idx]?.role !== 'assistant') return false
  if (idx === 0) return true
  return messages[idx - 1]?.role === 'user'
}

function UserMessage({ message, timestamp }: { message: UIMessage; timestamp?: string | number }) {
  const parts = message.parts ?? []
  const text = parts
    .map((p) => {
      const pt = p as { type?: string; text?: string }
      return pt.type === 'text' ? pt.text ?? '' : ''
    })
    .join('')
  const images = parts
    .filter((p) => {
      const pt = p as { type?: string; mediaType?: string; url?: string }
      return (
        pt.type === 'file' &&
        typeof pt.mediaType === 'string' &&
        pt.mediaType.startsWith('image/') &&
        typeof pt.url === 'string'
      )
    })
    .map((p) => ({ url: (p as { url: string }).url }))
  if (!text && images.length === 0) return null
  return (
    <Bubble variant="rep" text={text || undefined} images={images} timestamp={timestamp} />
  )
}

function AssistantMessage({
  message,
  timestamp,
  isFirstInRun,
  isStreamingTail,
  isThinking,
  onApprove,
  actionableApproval,
}: {
  message: UIMessage
  timestamp?: string | number
  isFirstInRun: boolean
  isStreamingTail: boolean
  isThinking: boolean
  onApprove: ApprovalResponseFn
  // Non-null only when this message is the LAST assistant message AND its
  // last step contains an approval-requested part. Stale historical
  // approval-requested parts on earlier messages render nothing — the SDK
  // can't re-target them, and the assistant's resolved reply (or the
  // normalized terminal state from loadConversationForClient) already
  // conveys the outcome.
  actionableApproval: ActionableApproval | null
}) {
  const parts = message.parts ?? []
  const text = parts
    .map((p) => {
      const pt = p as { type?: string; text?: string }
      return pt.type === 'text' ? pt.text ?? '' : ''
    })
    .join('')

  // Visibility is server-owned: the route emits transient `data-thinking`
  // signals (show / confirm / hide) and the parent threads `isThinking` here.
  // Approval cards always win so they're never hidden behind the rabbit.
  const showThinking = isThinking && !actionableApproval

  return (
    <>
      {showThinking ? (
        <ThinkingIndicator showGlyph={isFirstInRun} />
      ) : text ? (
        isStreamingTail ? (
          <StreamingBubble text={text} showGlyph={isFirstInRun} timestamp={timestamp} />
        ) : (
          <Bubble
            variant="thumper"
            showGlyph={isFirstInRun}
            text={text}
            renderMarkdown
            timestamp={timestamp}
          />
        )
      ) : null}
      {actionableApproval ? (
        <Bubble variant="thumper" showGlyph={!text && isFirstInRun}>
          <HITLBlock
            approvalId={actionableApproval.approvalId}
            toolName={actionableApproval.toolName}
            args={actionableApproval.input}
            onRespond={(approved) =>
              onApprove({ id: actionableApproval.approvalId, approved })
            }
          />
        </Bubble>
      ) : null}
    </>
  )
}
