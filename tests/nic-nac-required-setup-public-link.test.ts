import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildRequiredSetupPrompt } from '@/lib/nic-nac/required-setup-prompt'
import type { ToolDefinition } from '@/lib/nic-nac/tools/types'

const { saveRequiredSetupAnswerMock, completeRequiredSetupStepMock } = vi.hoisted(
  () => ({
    saveRequiredSetupAnswerMock: vi.fn(),
    completeRequiredSetupStepMock: vi.fn(),
  }),
)

vi.mock('@/lib/self-serve/required-setup', () => ({
  saveRequiredSetupAnswer: (...args: unknown[]) => saveRequiredSetupAnswerMock(...args),
  completeRequiredSetupStep: (...args: unknown[]) =>
    completeRequiredSetupStepMock(...args),
}))

function executeTool(
  tool: ReturnType<ToolDefinition['build']>,
  input: Record<string, unknown>,
) {
  return tool.execute?.(input as never, {} as never)
}

describe('Nic-Nac required setup public show link contract', () => {
  beforeEach(() => {
    saveRequiredSetupAnswerMock.mockReset()
    completeRequiredSetupStepMock.mockReset()
  })

  it('teaches Nic-Nac how to handle the generated Sparkle Suite show link', () => {
    const prompt = buildRequiredSetupPrompt()

    expect(prompt).toContain('Sparkle Suite show link')
    expect(prompt).toContain('generated from the live show name')
    expect(prompt).toContain('letters and numbers only')
    expect(prompt).toContain('no dashes, no underscores, no punctuation')
    expect(prompt).toContain("Possessive suffixes like 's are omitted")
    expect(prompt).toContain(
      "Gracie's Sparkle Party -> graciesparkleparty",
    )
    expect(prompt).toContain(
      'Only ask the rep to choose a different show link if',
    )
    expect(prompt).toContain('publicSiteSlugStatus')
    expect(prompt).toContain('publicSiteUrl')
  })

  it('blocks completing account basics until the public show link is accepted', async () => {
    saveRequiredSetupAnswerMock.mockResolvedValue({
      answers: {
        account_basics: {
          accountBasicsConfirmed: true,
          publicSiteSlugStatus: 'needs_review',
        },
      },
    })
    const { saveRequiredSetupAnswerTool } = await import(
      '@/lib/nic-nac/tools/save-required-setup-answer'
    )
    const tool = saveRequiredSetupAnswerTool.build({
      repId: 'rep-1',
      conversationId: 'conv-1',
      runId: 'run-1',
      supabase: {} as never,
    })

    await expect(
      executeTool(tool, {
        stepId: 'account_basics',
        answer: {
          accountBasicsConfirmed: true,
          publicSiteSlugStatus: 'needs_review',
        },
        completeStep: true,
      }),
    ).rejects.toThrow(
      'The Sparkle Suite show link must be accepted before completing account basics.',
    )

    expect(saveRequiredSetupAnswerMock).toHaveBeenCalledWith(
      'rep-1',
      'account_basics',
      {
        accountBasicsConfirmed: true,
        publicSiteSlugStatus: 'needs_review',
      },
      {},
    )
    expect(completeRequiredSetupStepMock).not.toHaveBeenCalled()
  })

  it('completes account basics when the saved public show link is accepted', async () => {
    saveRequiredSetupAnswerMock.mockResolvedValue({
      answers: {
        account_basics: {
          accountBasicsConfirmed: true,
          publicSiteSlugStatus: 'accepted',
          publicSiteSlug: 'graciesparkleparty',
          publicSiteUrl: 'https://www.yoursparklesuite.com/graciesparkleparty',
        },
      },
    })
    completeRequiredSetupStepMock.mockResolvedValue({
      currentStepId: 'site_skin',
    })
    const { saveRequiredSetupAnswerTool } = await import(
      '@/lib/nic-nac/tools/save-required-setup-answer'
    )
    const tool = saveRequiredSetupAnswerTool.build({
      repId: 'rep-1',
      conversationId: 'conv-1',
      runId: 'run-1',
      supabase: {} as never,
    })

    await expect(
      executeTool(tool, {
        stepId: 'account_basics',
        answer: {
          accountBasicsConfirmed: true,
        },
        completeStep: true,
      }),
    ).resolves.toEqual({ currentStepId: 'site_skin' })

    expect(saveRequiredSetupAnswerMock).toHaveBeenCalledWith(
      'rep-1',
      'account_basics',
      { accountBasicsConfirmed: true },
      {},
    )
    expect(completeRequiredSetupStepMock).toHaveBeenCalledWith(
      'rep-1',
      'account_basics',
    )
  })
})
