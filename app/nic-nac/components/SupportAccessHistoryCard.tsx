'use client'

import { useEffect, useState } from 'react'

type SupportAccessHistoryItem = {
  id: string
  operatorDisplayName: string
  reasonCode: string
  reasonNote: string | null
  status: string
  startedAt: string | null
  endedAt: string | null
  completionSummary: string | null
  createdAt: string
}

function formatDate(value: string | null) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/New_York',
  }).format(new Date(value))
}

export function SupportAccessHistoryCard() {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; sessions: SupportAccessHistoryItem[] }
  >({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/nic-nac/support-access-history', {
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as
          | { sessions?: SupportAccessHistoryItem[]; error?: string }
          | null
        if (!response.ok) throw new Error(body?.error ?? 'History could not be loaded.')
        setState({ status: 'ready', sessions: body?.sessions ?? [] })
      })
      .catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'History could not be loaded.',
        })
      })
    return () => controller.abort()
  }, [])

  return (
    <section
      id="support-access-history"
      style={{
        background: '#fff',
        border: '1px solid #ddd6fe',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 750, margin: 0 }}>Support access history</h2>
      <p style={{ color: '#57534e', margin: '6px 0 16px' }}>
        Every time Sparkle Suite Support enters your account, the access is recorded here.
      </p>
      {state.status === 'loading' ? <p>Loading access history…</p> : null}
      {state.status === 'error' ? <p role="alert">{state.message}</p> : null}
      {state.status === 'ready' && state.sessions.length === 0 ? (
        <p>No support access has been recorded.</p>
      ) : null}
      {state.status === 'ready' && state.sessions.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {state.sessions.map((session) => (
            <article
              key={session.id}
              style={{ background: '#fafafa', borderRadius: 12, padding: 14 }}
            >
              <strong>{session.operatorDisplayName} — {session.status}</strong>
              <div style={{ color: '#57534e', fontSize: 14, marginTop: 4 }}>
                Started {formatDate(session.startedAt ?? session.createdAt)}
                {session.endedAt ? ` · Ended ${formatDate(session.endedAt)}` : ''}
              </div>
              <div style={{ color: '#57534e', fontSize: 14, marginTop: 4 }}>
                Reason: {session.reasonCode.replaceAll('_', ' ')}
              </div>
              {session.reasonNote ? <p style={{ marginBottom: 0 }}>{session.reasonNote}</p> : null}
              {session.completionSummary ? (
                <p style={{ marginBottom: 0 }}>{session.completionSummary}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
