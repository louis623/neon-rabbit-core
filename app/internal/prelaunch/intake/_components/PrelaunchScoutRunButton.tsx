'use client'

import { useState } from 'react'
import type { PrelaunchScoutOutput } from '@/lib/prelaunch/scout'

interface PrelaunchScoutRunButtonProps {
  intakeId: string
}

export function PrelaunchScoutRunButton({
  intakeId,
}: PrelaunchScoutRunButtonProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>(
    'idle',
  )
  const [output, setOutput] = useState<PrelaunchScoutOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runScout() {
    setStatus('running')
    setError(null)
    setOutput(null)

    try {
      const response = await fetch('/api/prelaunch/scout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intakeId }),
      })
      const body = await response.json()

      if (!response.ok) {
        throw new Error(body.error ?? 'Scout run failed.')
      }

      setOutput(body.output)
      setStatus('done')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Scout run failed.')
      setStatus('error')
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Scout recommendation
          </h3>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Run the first Scout pass and save the result to agent_runs.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={status === 'running'}
          onClick={runScout}
          type="button"
        >
          {status === 'running' ? 'Running Scout...' : 'Run Scout'}
        </button>
      </div>

      {status === 'done' && output ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-white p-4 text-sm">
          <p className="font-semibold text-emerald-800">{output.briefTitle}</p>
          <p className="mt-2 leading-6 text-slate-700">{output.summary}</p>
          <p className="mt-3 font-semibold text-slate-800">
            Next step: {output.recommendedNextStep.replaceAll('_', ' ')}
          </p>
        </div>
      ) : null}

      {status === 'error' && error ? (
        <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
      ) : null}
    </div>
  )
}
