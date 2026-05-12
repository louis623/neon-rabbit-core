'use client'

import { useState } from 'react'
import type { PrelaunchScoutOutput } from '@/lib/prelaunch/scout'

interface PrelaunchScoutRunButtonProps {
  intakeId: string
}

interface PrelaunchScoutRecommendationResultProps {
  output: PrelaunchScoutOutput
}

export function PrelaunchScoutRecommendationResult({
  output,
}: PrelaunchScoutRecommendationResultProps) {
  return (
    <div className="mt-4 rounded-md border border-emerald-200 bg-white p-4 text-sm">
      <p className="font-semibold text-emerald-800">{output.briefTitle}</p>
      <p className="mt-2 leading-6 text-slate-700">{output.summary}</p>
      <p className="mt-3 font-semibold text-slate-800">
        Next step: {output.recommendedNextStep.replaceAll('_', ' ')}
      </p>

      {output.reusedLessons.length > 0 ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase text-amber-700">
            Reused Scout lessons
          </p>
          <ul className="mt-2 space-y-3 text-slate-700">
            {output.reusedLessons.map((lesson) => (
              <li
                className="rounded-md border border-amber-100 bg-white p-3"
                key={lesson.sourceRunKey}
              >
                <p className="text-sm leading-6 text-slate-800">
                  {lesson.lesson}
                </p>
                {lesson.similarityReasons &&
                lesson.similarityReasons.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-xs font-semibold uppercase text-amber-700">
                      Why Scout reused this
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-amber-900">
                      {lesson.similarityReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {lesson.sourceRunKey}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase text-slate-500">
          Manual research handoff
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-800">
          Status: {output.researchPlan.status.replaceAll('_', ' ')}
        </p>

        {output.researchPlan.searchQueries.length > 0 ? (
          <div className="mt-3">
            <p className="font-semibold text-slate-700">Search queries</p>
            <ul className="mt-2 space-y-1 text-slate-700">
              {output.researchPlan.searchQueries.map((query) => (
                <li key={query}>{query}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {output.researchPlan.evidenceChecklist.length > 0 ? (
          <div className="mt-3">
            <p className="font-semibold text-slate-700">Evidence checklist</p>
            <ul className="mt-2 space-y-1 text-slate-700">
              {output.researchPlan.evidenceChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {output.researchPlan.capturedEvidence.length > 0 ? (
          <div className="mt-3">
            <p className="font-semibold text-slate-700">Captured public evidence</p>
            <ul className="mt-2 space-y-3 text-slate-700">
              {output.researchPlan.capturedEvidence.map((item) => (
                <li
                  className="rounded-md border border-slate-200 bg-white p-3"
                  key={`${item.label}:${item.url}`}
                >
                  <p className="font-semibold text-slate-800">{item.label}</p>
                  {item.title ? <p className="mt-1 text-sm">{item.title}</p> : null}
                  {item.description ? (
                    <p className="mt-1 text-sm text-slate-600">
                      {item.description}
                    </p>
                  ) : null}
                  {item.primaryOutboundLink ? (
                    <div className="mt-2 rounded-md bg-emerald-50 p-2">
                      <p className="text-xs font-semibold uppercase text-emerald-700">
                        Likely primary customer link
                      </p>
                      <a
                        className="mt-1 inline-flex text-xs font-semibold text-emerald-700 underline"
                        href={item.primaryOutboundLink}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {item.primaryOutboundLink}
                      </a>
                      {item.primaryOutboundLinkReason ? (
                        <p className="mt-1 text-xs text-emerald-800">
                          {item.primaryOutboundLinkReason}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {item.outboundLinks.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Possible customer links
                      </p>
                      <ul className="mt-2 space-y-1">
                        {item.outboundLinks.map((link) => (
                          <li key={link}>
                            <a
                              className="inline-flex text-xs font-semibold text-slate-500 underline"
                              href={link}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <a
                    className="mt-2 inline-flex text-xs font-semibold text-slate-500 underline"
                    href={item.canonicalUrl ?? item.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {item.canonicalUrl ?? item.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {output.researchPlan.sourceReports.length > 0 ? (
          <div className="mt-3">
            <p className="font-semibold text-slate-700">Source check results</p>
            <ul className="mt-2 space-y-3 text-slate-700">
              {output.researchPlan.sourceReports.map((item) => (
                <li
                  className="rounded-md border border-slate-200 bg-white p-3"
                  key={`${item.label}:${item.url ?? 'not-provided'}`}
                >
                  <p className="font-semibold text-slate-800">
                    {item.label}: {item.status.replaceAll('_', ' ')}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{item.note}</p>
                  {item.url ? (
                    <a
                      className="mt-2 inline-flex text-xs font-semibold text-slate-500 underline"
                      href={item.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.url}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {output.researchPlan.blockers.length > 0 ? (
          <div className="mt-3 rounded-md bg-amber-50 p-3 text-amber-900">
            <p className="font-semibold">Research blockers</p>
            <ul className="mt-2 space-y-1">
              {output.researchPlan.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3">
        <p className="text-xs font-semibold uppercase text-sky-700">
          Public funnel read
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-800">
          {output.publicFunnel.shape.replaceAll('_', ' ')}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          {output.publicFunnel.summary}
        </p>

        {output.publicFunnel.primaryLinks.length > 0 ? (
          <div className="mt-3">
            <p className="font-semibold text-slate-700">Primary public links</p>
            <ul className="mt-2 space-y-1">
              {output.publicFunnel.primaryLinks.map((link) => (
                <li key={link}>
                  <a
                    className="inline-flex text-xs font-semibold text-slate-500 underline"
                    href={link}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {output.publicFunnel.concerns.length > 0 ? (
          <div className="mt-3 rounded-md bg-white p-2">
            <p className="font-semibold text-slate-700">What to confirm</p>
            <ul className="mt-2 space-y-1 text-slate-700">
              {output.publicFunnel.concerns.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {output.researchSynthesis.status !== 'not_available' ? (
        <div className="mt-4 rounded-md border border-violet-200 bg-violet-50 p-3">
          <p className="text-xs font-semibold uppercase text-violet-600">
            Scout synthesis
          </p>

          {output.researchSynthesis.discoveryAngle ? (
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
              {output.researchSynthesis.discoveryAngle}
            </p>
          ) : null}

          {output.researchSynthesis.summaryBullets.length > 0 ? (
            <div className="mt-3">
              <p className="font-semibold text-slate-700">What stands out</p>
              <ul className="mt-2 space-y-1 text-slate-700">
                {output.researchSynthesis.summaryBullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {output.researchSynthesis.followUpQuestions.length > 0 ? (
            <div className="mt-3">
              <p className="font-semibold text-slate-700">Follow-up questions</p>
              <ul className="mt-2 space-y-1 text-slate-700">
                {output.researchSynthesis.followUpQuestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
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
        <PrelaunchScoutRecommendationResult output={output} />
      ) : null}

      {status === 'error' && error ? (
        <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
      ) : null}
    </div>
  )
}
