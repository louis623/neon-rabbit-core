'use client'

import { FormEvent, useMemo, useState } from 'react'

import type { CustomerWaitlistLead } from '@/lib/prelaunch/customer-waitlist'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function sourceLabel(source: CustomerWaitlistLead['source']) {
  return source === 'manual' ? 'Manual entry' : 'Landing page'
}

export function CustomerWaitlistPanel({
  initialLeads,
}: {
  initialLeads: CustomerWaitlistLead[]
}) {
  const [leads, setLeads] = useState(initialLeads)
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const visibleLeads = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return leads
    return leads.filter((lead) =>
      [lead.name, lead.email, lead.phone ?? '', lead.notes]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [filter, leads])

  const updateLead = (updated: CustomerWaitlistLead) => {
    setLeads((current) => current.map((lead) => (lead.id === updated.id ? updated : lead)))
  }

  const requestUpdate = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/control-center/customer-waitlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = (await response.json()) as { lead?: CustomerWaitlistLead; error?: string }
    if (!response.ok || !payload.lead) throw new Error(payload.error ?? 'Unable to save.')
    updateLead(payload.lead)
  }

  const addManualLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/control-center/customer-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = (await response.json()) as { lead?: CustomerWaitlistLead; error?: string }
      if (!response.ok || !payload.lead) throw new Error(payload.error ?? 'Unable to add the entry.')
      setLeads((current) => [payload.lead!, ...current])
      setForm({ name: '', email: '', phone: '', notes: '' })
      setMessage('Customer added to the waitlist.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add the entry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="scroll-mt-6 rounded-lg border border-slate-200 bg-white shadow-sm" id="customer-waitlist">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Customer Waitlist</h2>
          <p className="mt-1 text-sm text-slate-600">
            Landing-page signups and manual prospects in one private operator list.
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {leads.filter((lead) => !lead.accountActivatedAt).length} awaiting account
        </p>
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="waitlist-search">
            Search waitlist
          </label>
          <input
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            id="waitlist-search"
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search name, email, phone, or notes"
            value={filter}
          />

          <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
            {visibleLeads.length === 0 ? (
              <p className="px-4 py-8 text-sm text-slate-500">No waitlist entries match this search.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleLeads.map((lead) => (
                  <article className="p-4" key={lead.id}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-950">{lead.name}</h3>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{sourceLabel(lead.source)}</span>
                          {lead.accountActivatedAt ? <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Account active</span> : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{lead.email}{lead.phone ? ` · ${lead.phone}` : ''}</p>
                        <p className="mt-1 text-xs text-slate-500">Added {formatDate(lead.createdAt)}</p>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800">
                        <input
                          checked={Boolean(lead.accountActivatedAt)}
                          onChange={async (event) => {
                            try {
                              await requestUpdate({ id: lead.id, accountActivated: event.target.checked })
                            } catch (error) {
                              setMessage(error instanceof Error ? error.message : 'Unable to save.')
                            }
                          }}
                          type="checkbox"
                        />
                        Account activated
                      </label>
                    </div>
                    <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor={`notes-${lead.id}`}>
                      Private notes
                    </label>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <textarea
                        className="min-h-20 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        defaultValue={lead.notes}
                        id={`notes-${lead.id}`}
                        onBlur={async (event) => {
                          if (event.target.value === lead.notes) return
                          try {
                            await requestUpdate({ id: lead.id, notes: event.target.value })
                          } catch (error) {
                            setMessage(error instanceof Error ? error.message : 'Unable to save notes.')
                          }
                        }}
                      />
                      <p className="text-xs text-slate-500 sm:w-28">Saves when you leave the note field.</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <form className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-4" onSubmit={addManualLead}>
          <h3 className="text-base font-semibold text-slate-950">Add customer</h3>
          <p className="mt-1 text-sm text-slate-600">Manual entries stay separate from landing-page consent.</p>
          {(['name', 'email', 'phone'] as const).map((field) => (
            <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor={`manual-${field}`} key={field}>
              {field === 'name' ? 'Name' : field === 'email' ? 'Email' : 'Phone (optional)'}
              <input
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                id={`manual-${field}`}
                onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                required={field !== 'phone'}
                type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                value={form[field]}
              />
            </label>
          ))}
          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="manual-notes">
            Private notes (optional)
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              id="manual-notes"
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              value={form.notes}
            />
          </label>
          <button className="mt-4 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="submit">
            {saving ? 'Adding…' : 'Add to waitlist'}
          </button>
          {message ? <p className="mt-3 text-sm text-slate-700" role="status">{message}</p> : null}
        </form>
      </div>
    </section>
  )
}
