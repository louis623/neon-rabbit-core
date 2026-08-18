import { beforeEach, describe, expect, it, vi } from 'vitest'

const afterCallback = vi.fn()
const processAutomation = vi.fn()

vi.mock('next/server', () => ({
  after: (callback: () => Promise<void>) => afterCallback(callback),
}))
vi.mock('@/lib/services/workspace-message-automation', () => ({
  processWorkspaceMessageAutomation: (...args: unknown[]) =>
    processAutomation(...args),
}))

import { dispatchWorkspaceMessageAutomationAfterResponse } from '@/lib/services/workspace-message-dispatch'

describe('workspace message post-response dispatch', () => {
  beforeEach(() => {
    afterCallback.mockReset()
    processAutomation.mockReset()
    processAutomation.mockResolvedValue({ claimed: 1, completed: 1, failed: 0 })
  })

  it('defers a bounded worker kick until after the response', async () => {
    const supabase = { marker: 'admin' }
    dispatchWorkspaceMessageAutomationAfterResponse({
      supabase: supabase as never,
      source: 'customer_signup',
    })

    expect(processAutomation).not.toHaveBeenCalled()
    expect(afterCallback).toHaveBeenCalledTimes(1)
    await afterCallback.mock.calls[0][0]()
    expect(processAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase,
        limit: 25,
        workerId: expect.stringMatching(/^customer_signup-/),
      }),
    )
  })

  it('contains transient worker failures so publication responses stay successful', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    processAutomation.mockRejectedValueOnce(new Error('temporary worker error'))
    dispatchWorkspaceMessageAutomationAfterResponse({
      supabase: {} as never,
      source: 'resource_publish',
    })

    await expect(afterCallback.mock.calls[0][0]()).resolves.toBeUndefined()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[workspace-messages] resource_publish dispatch failed',
      expect.any(Error),
    )
    consoleSpy.mockRestore()
  })
})
