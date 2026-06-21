import { describe, expect, it } from 'vitest'

import { buildNicNacSystemPrompt } from '@/lib/nic-nac/prompt-builder'
import { NIC_NAC_SYSTEM_PROMPT } from '@/lib/nic-nac/system-prompt'

describe('workspace Nic-Nac shared knowledge', () => {
  it('includes shared Nic-Nac knowledge in the workspace prompt', () => {
    const prompt = buildNicNacSystemPrompt({
      intents: [],
      activeToolNames: [],
    })

    expect(prompt).toContain('Sparkle Suite')
    expect(prompt).toContain('Bomb Party')
    expect(prompt).toContain('dance floor')
    expect(prompt).toContain('dancers')
    expect(prompt).toContain('item-for-item only')
    expect(prompt).toContain('MSRP is reference only')
    expect(prompt).toContain('not affiliated')
  })

  it('keeps workspace tool permissions separate from shared knowledge', () => {
    const prompt = buildNicNacSystemPrompt({
      intents: [],
      activeToolNames: [],
    })

    expect(prompt).toContain('Active tools for this turn:')
    expect(prompt).toContain('Only call tools in the active list')
    expect(prompt).toContain('Never invent listings')
    expect(prompt).toContain('Never operate on another rep')
  })

  it('teaches workspace Nic-Nac the same BP trade lingo as public Nic-Nac', () => {
    const prompt = buildNicNacSystemPrompt({
      intents: [],
      activeToolNames: [],
    })

    expect(prompt).toContain('dance floor')
    expect(prompt).toContain('dancers')
    expect(prompt).toContain('Customers do not add their own items or dancers')
    expect(prompt).toContain('The rep controls the board')
  })

  it('carries the trust-building personality and grounded uncertainty rules', () => {
    const prompt = buildNicNacSystemPrompt({
      intents: [],
      activeToolNames: [],
    })

    expect(prompt).toContain('slightly empathic')
    expect(prompt).toContain('trusted business partner')
    expect(prompt).toContain('business goals')
    expect(prompt).toContain('Ask probing questions')
    expect(prompt).toContain('Do not lie, hallucinate, or make things up')
    expect(prompt).toContain('Sparkle Suite, Sparkle Finder, Bomb Party')
  })

  it('keeps the legacy static reference aligned with the shared personality update', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('slightly empathic')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('trusted business partner')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('business goals')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'ask probing questions to gain clarity and understanding',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Do not lie, hallucinate, or make things up',
    )
  })

  it('teaches the rep-maintained catalog correction policy', () => {
    const routedPrompt = buildNicNacSystemPrompt({
      intents: ['catalog'],
      activeToolNames: ['search_jewelry_database', 'report_jewelry_catalog_issue'],
    })

    expect(NIC_NAC_SYSTEM_PROMPT).toContain('rep-maintained through Nic-Nac')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('report_jewelry_catalog_issue')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Do not promise Louis will review routine jewelry catalog issues',
    )
    expect(routedPrompt).toContain('rep-maintained through Nic-Nac')
    expect(routedPrompt).toContain('report_jewelry_catalog_issue')
    expect(routedPrompt).toContain(
      'Do not promise Louis will review routine jewelry catalog issues',
    )
    expect(routedPrompt).toContain('Collection year is practical organization')
    expect(routedPrompt).toContain('collectionName as "April Birthday 2026"')
    expect(routedPrompt).toContain('collectionYear as 2026')
    expect(routedPrompt).toContain('Tags are practical discovery helpers')
    expect(routedPrompt).toContain('Do not use rarity or hype tags')
    expect(routedPrompt).toContain('If unsure, skip the tag')
  })

  it('teaches Nic-Nac support report filing and Help & Resources fallback', () => {
    const routedPrompt = buildNicNacSystemPrompt({
      intents: ['resources'],
      activeToolNames: ['get_help_resources', 'submit_support_report'],
    })

    expect(routedPrompt).toContain('submit_support_report')
    expect(routedPrompt).toContain('file support reports')
    expect(routedPrompt).toContain('Help & Resources form')
    expect(routedPrompt).toContain('does not depend on Nic-Nac')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('submit_support_report')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('file support reports')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('Help & Resources form')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('does not depend on Nic-Nac')
  })
})
