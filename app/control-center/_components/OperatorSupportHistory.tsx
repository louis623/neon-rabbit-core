'use client'

export type OperatorSupportSessionStatus =
  | 'pending_notice'
  | 'active'
  | 'ended'
  | 'expired'
  | 'revoked'
  | 'failed'

export type OperatorSupportSession = {
  id: string
  targetRepId: string
  operatorDisplayName: string
  targetRepDisplayName: string
  reasonCode: string
  reasonNote?: string | null
  supportReportId?: string | null
  status: OperatorSupportSessionStatus
  createdAt: string
  startedAt?: string | null
  expiresAt?: string | null
  endedAt?: string | null
  changedAnything?: boolean | null
  completionSummary?: string | null
  workspaceUrl?: string | null
}

const STATUS_LABELS: Record<OperatorSupportSessionStatus, string> = {
  pending_notice: 'Preparing access',
  active: 'Active',
  ended: 'Completed',
  expired: 'Expired',
  revoked: 'Revoked',
  failed: 'Failed',
}

function words(value: string) {
  return value
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function statusClasses(status: OperatorSupportSessionStatus) {
  if (status === 'active') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }
  if (status === 'pending_notice') {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }
  if (status === 'failed' || status === 'revoked') {
    return 'border-rose-200 bg-rose-50 text-rose-800'
  }
  return 'border-slate-200 bg-slate-100 text-slate-700'
}

export function OperatorSupportHistory({
  sessions,
}: {
  sessions: OperatorSupportSession[]
}) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
        No support access has been recorded for this rep.
      </p>
    )
  }

  return (
    <ol className="space-y-3" aria-label="Support access history">
      {sessions.map((session) => (
        <li
          className="rounded-lg border border-slate-200 bg-white p-4"
          key={session.id}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {words(session.reasonCode)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {session.operatorDisplayName} · {formatDate(session.startedAt ?? session.createdAt)}
              </p>
            </div>
            <span
              className={`w-fit rounded-full border px-2 py-1 text-xs font-semibold ${statusClasses(
                session.status,
              )}`}
            >
              {STATUS_LABELS[session.status]}
            </span>
          </div>

          {session.reasonNote ? (
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {session.reasonNote}
            </p>
          ) : null}

          <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">Session ID</dt>
              <dd className="mt-0.5 break-all font-mono">{session.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">
                {session.status === 'active' ? 'Expires' : 'Ended'}
              </dt>
              <dd className="mt-0.5">
                {formatDate(
                  session.status === 'active'
                    ? session.expiresAt
                    : session.endedAt ?? session.expiresAt,
                )}
              </dd>
            </div>
          </dl>

          {session.completionSummary ? (
            <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {session.completionSummary}
            </p>
          ) : session.changedAnything === false ? (
            <p className="mt-3 text-xs font-semibold text-slate-500">
              No account changes were recorded during this session.
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
