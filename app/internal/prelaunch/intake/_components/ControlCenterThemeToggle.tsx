'use client'

import { useEffect, useState } from 'react'

type ControlCenterTheme = 'light' | 'dark'

const STORAGE_KEY = 'sparkle-suite-control-center-theme'

function isControlCenterTheme(value: string | null): value is ControlCenterTheme {
  return value === 'light' || value === 'dark'
}

function applyControlCenterTheme(theme: ControlCenterTheme) {
  document.documentElement.dataset.controlCenterTheme = theme
}

export function ControlCenterThemeToggle() {
  const [theme, setTheme] = useState<ControlCenterTheme>('light')

  useEffect(() => {
    let storedTheme: string | null = null

    try {
      storedTheme = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      storedTheme = null
    }

    const nextTheme = isControlCenterTheme(storedTheme) ? storedTheme : 'light'

    setTheme(nextTheme)
    applyControlCenterTheme(nextTheme)
  }, [])

  function selectTheme(nextTheme: ControlCenterTheme) {
    setTheme(nextTheme)
    applyControlCenterTheme(nextTheme)

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // The visible theme should still change if storage is unavailable.
    }
  }

  return (
    <div
      aria-label="Control Center theme"
      className="inline-flex min-h-10 w-fit rounded-md border border-slate-300 bg-white p-1 shadow-sm"
      role="group"
    >
      {(['light', 'dark'] as const).map((option) => {
        const isSelected = theme === option

        return (
          <button
            aria-pressed={isSelected}
            className={
              isSelected
                ? 'rounded px-3 text-sm font-semibold text-white transition bg-slate-950'
                : 'rounded px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950'
            }
            key={option}
            onClick={() => selectTheme(option)}
            type="button"
          >
            {option === 'light' ? 'Light mode' : 'Dark mode'}
          </button>
        )
      })}
    </div>
  )
}
