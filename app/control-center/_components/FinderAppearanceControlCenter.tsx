'use client'

import { useState } from 'react'

import { ControlCenterProductSwitcher } from './ControlCenterProductSwitcher'
import { AMETHYST_SKIN_CARDS } from '@/lib/amethyst/skin-cards'
import { SPARKLE_FINDER_APPEARANCE_PRESET_IDS } from '@/lib/sparkle-finder/appearance-presets'
import type { SparkleFinderAppearance } from '@/lib/sparkle-finder/appearance'

export function FinderAppearanceControlCenter({ initialAppearance }: { initialAppearance: SparkleFinderAppearance }) {
  const [selected, setSelected] = useState(initialAppearance.preset)
  const [saved, setSaved] = useState(initialAppearance.preset)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveAppearance() {
    setSaving(true)
    setStatus('')
    try {
      const response = await fetch('/api/control-center/finder-appearance', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ appearancePreset: selected }),
      })
      if (!response.ok) throw new Error('save_failed')
      setSaved(selected)
      setStatus('Saved. Sparkle Finder will use this look within about 30 seconds.')
    } catch {
      setStatus('The appearance could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="control-center-surface min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Sparkle Finder</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal">Sparkle Finder Control Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage Sparkle Finder from the same private operator workspace while keeping its customer accounts, database, and deployment independent.
            </p>
          </div>
          <ControlCenterProductSwitcher active="finder" />
          <a className="text-sm font-bold text-violet-700 underline underline-offset-4" href="/control-center/accounting?product=finder">Open Sparkle Finder accounting</a>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Appearance</p>
              <h2 className="mt-1 text-2xl font-semibold">Sparkle Finder appearance</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Choose from the same approved visual presets available to Sparkle Suite customer-facing sites. This changes Finder styling only.
              </p>
            </div>
            <a className="text-sm font-bold text-violet-700 underline underline-offset-4" href="https://yoursparklefinder.com" rel="noreferrer" target="_blank">
              Open Sparkle Finder
            </a>
          </div>

          <fieldset className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <legend className="sr-only">Sparkle Finder appearance preset</legend>
            {AMETHYST_SKIN_CARDS.filter((card) => (SPARKLE_FINDER_APPEARANCE_PRESET_IDS as readonly string[]).includes(card.id)).map((card) => {
              const isSelected = selected === card.id
              const isLive = saved === card.id
              return (
                <label
                  className={`cursor-pointer rounded-xl border-2 p-4 transition ${isSelected ? 'border-violet-600 bg-violet-50 shadow-sm' : 'border-slate-200 bg-white hover:border-violet-300'}`}
                  data-selected={isSelected}
                  key={card.id}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-base font-bold text-slate-950">{card.label}</span>
                      <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{card.code}</span>
                    </span>
                    {isLive ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">Live</span> : null}
                  </span>
                  <span className="mt-3 block text-sm leading-6 text-slate-600">{card.description}</span>
                  <span className="mt-4 flex gap-2" aria-hidden="true">
                    {card.swatches.map((swatch) => (
                      <span className="size-7 rounded-full border border-black/10 shadow-inner" key={swatch.label} style={{ backgroundColor: swatch.value }} />
                    ))}
                  </span>
                  <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      checked={isSelected}
                      name="appearancePreset"
                      onChange={() => setSelected(card.id)}
                      type="radio"
                      value={card.id}
                    />
                    Use {card.label}
                  </span>
                </label>
              )
            })}
          </fieldset>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-violet-700 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving || selected === saved}
              onClick={saveAppearance}
              type="button"
            >
              {saving ? 'Saving…' : 'Apply to Sparkle Finder'}
            </button>
            <p aria-live="polite" className="text-sm font-semibold text-slate-600" role="status">{status}</p>
          </div>
        </section>
      </div>
    </main>
  )
}
