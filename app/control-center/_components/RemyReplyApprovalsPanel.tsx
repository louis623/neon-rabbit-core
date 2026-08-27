'use client'

import { useCallback, useEffect, useState } from 'react'

import { formatCommunicationDate, readCommunicationResponse } from './control-center-communications'

type Approval = {
  id: string
  reportId: string
  conversationId: string
  reportTitle: string
  reply: string
  status: string
  requestedAt: string
  expiresAt: string
}

export function RemyReplyApprovalsPanel() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/control-center/remy-reply-approvals', { cache: 'no-store' })
      const body = await readCommunicationResponse(response)
      setApprovals(Array.isArray(body.approvals) ? body.approvals as Approval[] : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Reply approvals could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function decide(requestId: string, decision: 'approve' | 'decline') {
    setSavingId(requestId)
    setError(null)
    try {
      const response = await fetch('/api/control-center/remy-reply-approvals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId, decision }),
      })
      await readCommunicationResponse(response)
      setApprovals((current) => current.filter((approval) => approval.id !== requestId))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Reply approval could not be saved.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <main className="control-center-surface min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Sparkle Suite Control Center</p>
          <h1 className="mt-1 text-3xl font-semibold">Remy reply approvals</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Remy can only send the exact Support reply you approve here. Approval expires after 15 minutes; broadcasts, status changes, Task List work, and Network Safety actions remain human-only.
          </p>
        </header>
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
        {loading ? <p className="text-sm text-slate-600">Loading approvals…</p> : null}
        {!loading && approvals.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No pending Remy reply approvals.</p> : null}
        {approvals.map((approval) => (
          <article className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm" key={approval.id}>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Support reply request</p>
            <h2 className="mt-1 text-lg font-semibold">{approval.reportTitle}</h2>
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-800">{approval.reply}</p>
            <p className="mt-3 text-xs text-slate-500">Requested {formatCommunicationDate(approval.requestedAt)} · Expires {formatCommunicationDate(approval.expiresAt)}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={savingId === approval.id} onClick={() => void decide(approval.id, 'approve')} type="button">Approve one-time send</button>
              <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50" disabled={savingId === approval.id} onClick={() => void decide(approval.id, 'decline')} type="button">Decline</button>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
