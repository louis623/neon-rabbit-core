import { describe, expect, it } from 'vitest'
import {
  listNicNacWorkKnowledgeArticles,
  searchNicNacWorkKnowledge,
} from '@/lib/nic-nac/knowledge/search-work-knowledge'
import { buildToolsForIntents } from '@/lib/nic-nac/tools'
import type { ToolContext } from '@/lib/nic-nac/tools/types'

describe('Nic-Nac grounded work knowledge', () => {
  it('returns source, freshness, scope, confidence, and boundaries for live-stream troubleshooting', () => {
    const result = searchNicNacWorkKnowledge(
      'My TikTok live is frozen and customers cannot hear my microphone. What should I check?',
    )

    expect(result.matched).toBe(true)
    expect(result.results[0]).toMatchObject({
      sourceId: 'sparkle-suite:live-stream-troubleshooting@2026-09-01',
      scope: 'live_streaming_practice',
      sourceOwner: 'Sparkle Suite live-streaming playbook',
      reviewedAt: '2026-09-01',
      freshness: 'evergreen_reviewed',
      confidence: 'medium',
      boundaries: expect.arrayContaining([
        expect.stringContaining('Platform-specific buttons'),
      ]),
    })
    expect(result.guidance).toContain('live workspace tool for current rep data')
  })

  it('separates official Bomb Party policy uncertainty from grounded product help', () => {
    const result = searchNicNacWorkKnowledge(
      'What is the official Bomb Party compensation policy?',
    )

    expect(result.results[0]).toMatchObject({
      scope: 'bomb_party_context',
      confidence: 'high',
    })
    expect(result.results[0].summary).toContain(
      'must come from the current authoritative source',
    )
    expect(result.results[0].boundaries).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Do not invent official Bomb Party policies'),
      ]),
    )
  })

  it('returns an honest no-match contract instead of generic invented expertise', () => {
    const result = searchNicNacWorkKnowledge('quantum chromodynamics textbook')

    expect(result).toMatchObject({ matched: false, results: [] })
    expect(result.guidance).toContain('do not invent')
  })

  it('keeps every curated article versioned and bounded', () => {
    for (const article of listNicNacWorkKnowledgeArticles()) {
      expect(article.sourceId).toMatch(/@\d{4}-\d{2}-\d{2}$/)
      expect(article.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(article.steps.length).toBeGreaterThanOrEqual(4)
      expect(article.boundaries.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('exposes grounded work knowledge alongside Help & Resources', () => {
    const tools = buildToolsForIntents(
      {
        repId: 'rep-1',
        conversationId: 'conversation-1',
        runId: 'run-1',
        supabase: {} as never,
      } satisfies ToolContext,
      ['resources'],
    )

    expect(Object.keys(tools)).toEqual([
      'get_help_resources',
      'search_work_knowledge',
      'submit_support_report',
    ])
  })
})
