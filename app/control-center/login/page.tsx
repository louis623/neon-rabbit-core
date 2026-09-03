'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function accountingViewerDestination(value: string | null) {
  if (value === '/control-center/accounting' || value === '/control-center/accounting?product=finder') return value
  return '/control-center'
}

export default function ControlCenterLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/control-center/session', {
        body: JSON.stringify({ username, password }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Unable to sign in.')
      router.replace(accountingViewerDestination(searchParams.get('redirect')))
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950">
      <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sparkle Suite</p>
        <h1 className="mt-1 text-2xl font-semibold">Control Center sign in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Sign in with your Control Center username and password. This is independent from the Sparkle Suite Workspace account already open in this browser.</p>
        <form className="mt-6" onSubmit={submit}>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="control-center-username">Username</label>
          <input autoComplete="username" className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" id="control-center-username" onChange={(event) => setUsername(event.target.value)} required type="text" value={username} />
          <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="control-center-password">Password</label>
          <input autoComplete="current-password" className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" id="control-center-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          <button className="mt-4 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="submit">{saving ? 'Signing in…' : 'Open Control Center'}</button>
          {error ? <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p> : null}
        </form>
      </section>
    </main>
  )
}
