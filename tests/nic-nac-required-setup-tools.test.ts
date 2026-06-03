import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ToolDefinition } from '@/lib/nic-nac/tools/types'

const {
  getRequiredSetupStateMock,
  saveRequiredSetupAnswerMock,
  completeRequiredSetupStepMock,
  unlockRequiredSetupMock,
  sendLouisAlertMock,
} = vi.hoisted(() => ({
  getRequiredSetupStateMock: vi.fn(),
  saveRequiredSetupAnswerMock: vi.fn(),
  completeRequiredSetupStepMock: vi.fn(),
  unlockRequiredSetupMock: vi.fn(),
  sendLouisAlertMock: vi.fn(),
}))

vi.mock('@/lib/self-serve/required-setup', () => ({
  getRequiredSetupState: (...args: unknown[]) => getRequiredSetupStateMock(...args),
  saveRequiredSetupAnswer: (...args: unknown[]) => saveRequiredSetupAnswerMock(...args),
  completeRequiredSetupStep: (...args: unknown[]) =>
    completeRequiredSetupStepMock(...args),
  unlockRequiredSetup: (...args: unknown[]) => unlockRequiredSetupMock(...args),
}))

vi.mock('@/lib/ops/louis-alerts', () => ({
  sendLouisAlert: (...args: unknown[]) => sendLouisAlertMock(...args),
}))

function ctx() {
  return {
    repId: 'rep-1',
    conversationId: 'conv-1',
    runId: 'run-1',
    supabase: {} as never,
  }
}

function executeTool(
  tool: ReturnType<ToolDefinition['build']>,
  input: Record<string, unknown>,
) {
  return tool.execute?.(input as never, {} as never)
}

describe('required setup tools', () => {
  beforeEach(() => {
    getRequiredSetupStateMock.mockReset()
    saveRequiredSetupAnswerMock.mockReset()
    completeRequiredSetupStepMock.mockReset()
    unlockRequiredSetupMock.mockReset()
    sendLouisAlertMock.mockReset()
  })

  it('reads required setup state', async () => {
    getRequiredSetupStateMock.mockResolvedValue({ status: 'required_setup' })
    const { getRequiredSetupStateTool } = await import(
      '@/lib/nic-nac/tools/get-required-setup-state'
    )
    const tool = getRequiredSetupStateTool.build(ctx())

    await expect(executeTool(tool, {})).resolves.toEqual({
      status: 'required_setup',
    })
    expect(getRequiredSetupStateMock).toHaveBeenCalledWith('rep-1')
  })

  it('saves an answer with generated copy and support state patches', async () => {
    saveRequiredSetupAnswerMock.mockResolvedValue({ currentStep: 'account_basics' })
    const { saveRequiredSetupAnswerTool } = await import(
      '@/lib/nic-nac/tools/save-required-setup-answer'
    )
    const tool = saveRequiredSetupAnswerTool.build(ctx())

    await expect(
      executeTool(tool, {
        stepId: 'welcome_copy',
        answer: { tone: 'warm' },
        generatedCopy: { headline: 'Welcome sparkle friends' },
        supportState: { reviewed: false },
      }),
    ).resolves.toEqual({ currentStep: 'account_basics' })

    expect(saveRequiredSetupAnswerMock).toHaveBeenCalledWith(
      'rep-1',
      'welcome_copy',
      { tone: 'warm' },
      {
        generatedCopyPatch: { headline: 'Welcome sparkle friends' },
        supportStatePatch: { reviewed: false },
      },
    )
    expect(completeRequiredSetupStepMock).not.toHaveBeenCalled()
  })

  it('completes the step when requested after saving an answer', async () => {
    saveRequiredSetupAnswerMock.mockResolvedValue({ currentStep: 'account_basics' })
    completeRequiredSetupStepMock.mockResolvedValue({ currentStep: 'site_skin' })
    const { saveRequiredSetupAnswerTool } = await import(
      '@/lib/nic-nac/tools/save-required-setup-answer'
    )
    const tool = saveRequiredSetupAnswerTool.build(ctx())

    await expect(
      executeTool(tool, {
        stepId: 'account_basics',
        answer: { businessName: 'Sparkle Test' },
        completeStep: true,
      }),
    ).resolves.toEqual({ currentStep: 'site_skin' })

    expect(saveRequiredSetupAnswerMock).toHaveBeenCalledWith(
      'rep-1',
      'account_basics',
      { businessName: 'Sparkle Test' },
      {},
    )
    expect(completeRequiredSetupStepMock).toHaveBeenCalledWith(
      'rep-1',
      'account_basics',
    )
  })

  it('surfaces skipped setup blocker alerts so Nic-Nac does not claim Louis was notified', async () => {
    sendLouisAlertMock.mockResolvedValue({
      delivered: false,
      reason: 'telegram_not_configured',
    })
    const { requestRequiredSetupSupportTool } = await import(
      '@/lib/nic-nac/tools/request-required-setup-support'
    )
    const tool = requestRequiredSetupSupportTool.build(ctx())

    await expect(
      executeTool(tool, {
        reason: 'Rep cannot preview site',
        severity: 'error',
      }),
    ).resolves.toEqual({
      ok: false,
      delivered: false,
      reason: 'telegram_not_configured',
    })

    expect(sendLouisAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Nic-Nac setup needs Louis',
        severity: 'error',
        lines: expect.arrayContaining([
          'Rep ID: rep-1',
          'Conversation: conv-1',
          'Run: run-1',
          'Reason: Rep cannot preview site',
        ]),
      }),
    )
  })

  it('returns delivered when Louis is notified for setup blockers', async () => {
    sendLouisAlertMock.mockResolvedValue({ delivered: true })
    const { requestRequiredSetupSupportTool } = await import(
      '@/lib/nic-nac/tools/request-required-setup-support'
    )
    const tool = requestRequiredSetupSupportTool.build(ctx())

    await expect(
      executeTool(tool, {
        reason: 'Rep cannot preview site',
        severity: 'warning',
      }),
    ).resolves.toEqual({ ok: true, delivered: true })
  })

  it('propagates thrown Louis alert failures', async () => {
    sendLouisAlertMock.mockRejectedValue(new Error('telegram failed'))
    const { requestRequiredSetupSupportTool } = await import(
      '@/lib/nic-nac/tools/request-required-setup-support'
    )
    const tool = requestRequiredSetupSupportTool.build(ctx())

    await expect(
      executeTool(tool, {
        reason: 'Preview route is failing',
        severity: 'warning',
      }),
    ).rejects.toThrow('telegram failed')
  })

  it('requires final preview approval before unlocking setup', async () => {
    const { unlockRequiredSetupTool } = await import(
      '@/lib/nic-nac/tools/unlock-required-setup'
    )
    const tool = unlockRequiredSetupTool.build(ctx())

    await expect(
      executeTool(tool, {
        repApprovedPreview: false,
      }),
    ).rejects.toThrow('approve the final preview')
    expect(unlockRequiredSetupMock).not.toHaveBeenCalled()
  })

  it('unlocks required setup after preview approval', async () => {
    unlockRequiredSetupMock.mockResolvedValue({ status: 'dashboard_unlocked' })
    const { unlockRequiredSetupTool } = await import(
      '@/lib/nic-nac/tools/unlock-required-setup'
    )
    const tool = unlockRequiredSetupTool.build(ctx())

    await expect(
      executeTool(tool, {
        repApprovedPreview: true,
      }),
    ).resolves.toEqual({ status: 'dashboard_unlocked' })
    expect(unlockRequiredSetupMock).toHaveBeenCalledWith('rep-1')
  })
})
