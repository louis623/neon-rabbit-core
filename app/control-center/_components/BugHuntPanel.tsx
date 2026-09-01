'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

import {
  BUG_HUNT_ITEM_TYPES,
  BUG_HUNT_PRIORITIES,
  BUG_HUNT_STATUSES,
  type BugHuntItem,
  type BugHuntPriority,
  type BugHuntItemType,
} from '@/lib/control-center/bug-hunt'

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const PRIORITY_RANK: Record<BugHuntPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
type DateFilter = 'all' | 'today' | 'last_7_days' | 'last_30_days'

function priorityClass(priority: BugHuntPriority) {
  return {
    urgent: 'bg-rose-100 text-rose-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-slate-100 text-slate-700',
  }[priority]
}

function isWithinDateFilter(updatedAt: string, filter: DateFilter, now: Date) {
  if (filter === 'all') return true
  const updated = new Date(updatedAt)
  if (Number.isNaN(updated.getTime())) return false
  const start = new Date(now)
  if (filter === 'today') start.setHours(0, 0, 0, 0)
  if (filter === 'last_7_days') start.setDate(start.getDate() - 7)
  if (filter === 'last_30_days') start.setDate(start.getDate() - 30)
  return updated >= start
}

export function BugHuntPanel({ initialItems }: { initialItems: BugHuntItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<BugHuntPriority | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [form, setForm] = useState({ title: '', itemType: 'bug' as BugHuntItemType, priority: 'medium' as BugHuntPriority, owner: '', details: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const openItems = items.filter((item) => item.status !== 'complete')
  const archivedItems = items.filter((item) => item.status === 'complete')
  const visibleItems = useMemo(() => {
    const query = filter.trim().toLowerCase()
    const now = new Date()
    return openItems
      .filter((item) => !query || [item.title, item.details, item.owner, item.itemType, item.status, item.priority].join(' ').toLowerCase().includes(query))
      .filter((item) => priorityFilter === 'all' || item.priority === priorityFilter)
      .filter((item) => isWithinDateFilter(item.updatedAt, dateFilter, now))
      .toSorted((left, right) => PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority] || new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  }, [dateFilter, filter, openItems, priorityFilter])

  const replaceItem = (updated: BugHuntItem) => setItems((current) => current.map((item) => item.id === updated.id ? updated : item))

  const updateItem = async (id: string, body: Record<string, unknown>) => {
    const response = await fetch('/api/control-center/bug-hunt', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }) })
    const payload = (await response.json()) as { item?: BugHuntItem; error?: string }
    if (!response.ok || !payload.item) throw new Error(payload.error ?? 'Unable to save the task.')
    replaceItem(payload.item)
  }

  const addItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/control-center/bug-hunt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const payload = (await response.json()) as { item?: BugHuntItem; error?: string }
      if (!response.ok || !payload.item) throw new Error(payload.error ?? 'Unable to add the task.')
      setItems((current) => [payload.item!, ...current])
      setForm({ title: '', itemType: 'bug', priority: 'medium', owner: '', details: '' })
      setMessage('Task added to Task List.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add the task.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <details className="group/bug-hunt control-center-panel scroll-mt-6 rounded-lg border border-slate-200 bg-white shadow-sm" id="bug-hunt-updates">
      <summary aria-label="Expand Task List" className="control-center-summary flex cursor-pointer list-none flex-col gap-3 px-4 py-4 marker:hidden md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Task List</h2>
            <ChevronDown aria-hidden="true" className="h-5 w-5 text-slate-500 transition group-open/bug-hunt:rotate-180" />
          </div>
          <p className="mt-1 text-sm text-slate-600">Private operator backlog for bugs, improvements, content work, research, and operational follow-ups.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="text-xs font-semibold uppercase tracking-wide text-sky-700 underline underline-offset-4" onClick={() => setArchiveOpen(true)} type="button">Completed archive ({archivedItems.length})</button>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{openItems.length} open</p>
        </div>
      </summary>
      <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="bug-hunt-search">Search tasks</label>
          <input className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" id="bug-hunt-search" onChange={(event) => setFilter(event.target.value)} placeholder="Search title, owner, type, priority, or notes" value={filter} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Priority<select className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-900" onChange={(event) => setPriorityFilter(event.target.value as BugHuntPriority | 'all')} value={priorityFilter}><option value="all">All priorities</option>{BUG_HUNT_PRIORITIES.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}</select></label>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Updated date<select className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-900" onChange={(event) => setDateFilter(event.target.value as DateFilter)} value={dateFilter}><option value="all">Any time</option><option value="today">Today</option><option value="last_7_days">Last 7 days</option><option value="last_30_days">Last 30 days</option></select></label>
          </div>
          <div className="mt-4 space-y-3">
            {visibleItems.map((item) => (
              <article className="rounded-md border border-slate-200 p-4" key={item.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                  <div className="flex flex-wrap gap-2"><span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{label(item.itemType)}</span><span className={`rounded-full px-2 py-1 text-xs font-semibold ${priorityClass(item.priority)}`}>{label(item.priority)}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{label(item.status)}</span></div>
                    <h3 className="mt-2 text-base font-semibold text-slate-950">{item.title}</h3>
                    {item.source ? <p className="mt-1 text-xs text-slate-500">{item.source}</p> : null}
                    {item.sourceSupportReportId ? (
                      <Link
                        className="mt-2 inline-flex text-xs font-semibold text-violet-700 underline underline-offset-4"
                        href="/control-center/messages?view=support"
                      >
                        View linked Support report {item.sourceSupportReportId}
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3"><label className="text-xs font-bold uppercase tracking-wide text-slate-500">Priority<select className="mt-1 block rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium normal-case text-slate-900" onChange={async (event) => { try { await updateItem(item.id, { priority: event.target.value }) } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save.') } }} value={item.priority}>{BUG_HUNT_PRIORITIES.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}</select></label><label className="text-xs font-bold uppercase tracking-wide text-slate-500">Status<select className="mt-1 block rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium normal-case text-slate-900" onChange={async (event) => { try { await updateItem(item.id, { status: event.target.value }) } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save.') } }} value={item.status}>{BUG_HUNT_STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label></div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Owner<input className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium normal-case text-slate-900" defaultValue={item.owner} onBlur={async (event) => { if (event.target.value === item.owner) return; try { await updateItem(item.id, { owner: event.target.value }) } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save.') } }} /></label>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">Notes<textarea className="mt-1 min-h-20 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium normal-case text-slate-900" defaultValue={item.details} onBlur={async (event) => { if (event.target.value === item.details) return; try { await updateItem(item.id, { details: event.target.value }) } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save.') } }} /></label>
                </div>
              </article>
            ))}
            {visibleItems.length === 0 ? <p className="py-6 text-sm text-slate-500">No matching tasks.</p> : null}
          </div>
        </div>
        <form className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-4" onSubmit={addItem}>
          <h3 className="text-base font-semibold text-slate-950">Add an unfinished item</h3>
          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">Task title<input className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required value={form.title} /></label>
          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">Type<select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" onChange={(event) => setForm((current) => ({ ...current, itemType: event.target.value as BugHuntItemType }))} value={form.itemType}>{BUG_HUNT_ITEM_TYPES.map((type) => <option key={type} value={type}>{label(type)}</option>)}</select></label>
          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">Priority<select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as BugHuntPriority }))} value={form.priority}>{BUG_HUNT_PRIORITIES.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}</select></label>
          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">Owner (optional)<input className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" onChange={(event) => setForm((current) => ({ ...current, owner: event.target.value }))} value={form.owner} /></label>
          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes (optional)<textarea className="mt-1 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} value={form.details} /></label>
          <button className="mt-4 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="submit">{saving ? 'Adding…' : 'Add item'}</button>
          {message ? <p className="mt-3 text-sm text-slate-700" role="status">{message}</p> : null}
        </form>
      </div>
      <div className="border-t border-slate-200 px-4 py-3">
        <button className="text-sm font-semibold text-sky-700 underline underline-offset-4" onClick={() => setArchiveOpen(true)} type="button">
          View completed task archive ({archivedItems.length})
        </button>
      </div>
      {archiveOpen ? <div aria-labelledby="completed-task-archive-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog">
        <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-950" id="completed-task-archive-title">Completed task archive</h3>
              <p className="mt-1 text-sm text-slate-600">Completed tasks are kept here until you reactivate them.</p>
            </div>
            <button aria-label="Close completed task archive" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700" onClick={() => setArchiveOpen(false)} type="button">Close</button>
          </div>
          <div className="space-y-3 p-5">
            {archivedItems.map((item) => <article className="rounded-md border border-slate-200 p-4" key={item.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2"><span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{label(item.itemType)}</span><span className={`rounded-full px-2 py-1 text-xs font-semibold ${priorityClass(item.priority)}`}>{label(item.priority)}</span><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Completed</span></div>
                  <h4 className="mt-2 text-base font-semibold text-slate-950">{item.title}</h4>
                  {item.owner ? <p className="mt-1 text-sm text-slate-600">Owner: {item.owner}</p> : null}
                  {item.details ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.details}</p> : null}
                </div>
                <button className="shrink-0 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white" onClick={async () => { try { await updateItem(item.id, { status: 'open' }) } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to reactivate the task.') } }} type="button">Reactivate</button>
              </div>
            </article>)}
            {archivedItems.length === 0 ? <p className="py-6 text-sm text-slate-500">No completed tasks are archived yet.</p> : null}
          </div>
        </div>
      </div> : null}
    </details>
  )
}
