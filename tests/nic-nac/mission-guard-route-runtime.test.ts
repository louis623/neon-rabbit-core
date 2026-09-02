import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NIC_NAC_MISSION_REDIRECT_MESSAGE } from '@/lib/nic-nac/core/mission-guard'

const {
  supabaseMock,
  streamTextMock,
  getPaidNicNacContextMock,
  loadCanonicalHistoryMock,
  insertUserMessageMock,
  reserveAssistantMessageMock,
  completeAssistantMock,
  abortAssistantMock,
  checkpointAssistantMock,
  recordApprovalEventMock,
  buildToolsForIntentsMock,
  getToolIntentsForMessagesMock,
  shouldRequireToolCallForMessagesMock,
  buildNicNacSystemPromptMock,
  probeConversationOwnerMock,
  logIncidentMock,
  decideAssistantMessageIdMock,
  selectMessagesForModelMock,
  logNicNacRunMock,
  normalizeRunUsageMock,
  getNicNacModelPolicyMock,
  getNicNacLanguageModelMock,
  getNicNacProviderOptionsMock,
  estimateNicNacRunCostCentsMock,
  filterNicNacToolIntentsForContextMock,
  assembleNicNacContextMock,
  loadSuiteRepMemoryCardsMock,
  chooseNicNacToolChoiceForStepMock,
  createAdminClientMock,
  normalizeNicNacAssistantPartsMock,
  getOrCreateTradeBoardIntakeContextMock,
  mergeWorkflowToolIntentsMock,
  summarizeHardFailDetectionMock,
  AuthError,
  ServiceError,
} = vi.hoisted(() => {
  class AuthError extends Error {}
  class ServiceError extends Error {
    code = 'SERVICE_ERROR'
    statusCode = 500
    userMessage = 'Service error'
  }

  return {
    supabaseMock: {},
    streamTextMock: vi.fn(),
    getPaidNicNacContextMock: vi.fn(),
    loadCanonicalHistoryMock: vi.fn(),
    insertUserMessageMock: vi.fn(),
    reserveAssistantMessageMock: vi.fn(),
    completeAssistantMock: vi.fn(),
    abortAssistantMock: vi.fn(),
    checkpointAssistantMock: vi.fn(),
    recordApprovalEventMock: vi.fn(),
    buildToolsForIntentsMock: vi.fn(),
    getToolIntentsForMessagesMock: vi.fn(),
    shouldRequireToolCallForMessagesMock: vi.fn(),
    buildNicNacSystemPromptMock: vi.fn(),
    probeConversationOwnerMock: vi.fn(),
    logIncidentMock: vi.fn(),
    decideAssistantMessageIdMock: vi.fn(),
    selectMessagesForModelMock: vi.fn(),
    logNicNacRunMock: vi.fn(),
    normalizeRunUsageMock: vi.fn(),
    getNicNacModelPolicyMock: vi.fn(),
    getNicNacLanguageModelMock: vi.fn(),
    getNicNacProviderOptionsMock: vi.fn(),
    estimateNicNacRunCostCentsMock: vi.fn(),
    filterNicNacToolIntentsForContextMock: vi.fn(),
    assembleNicNacContextMock: vi.fn(),
    loadSuiteRepMemoryCardsMock: vi.fn(),
    chooseNicNacToolChoiceForStepMock: vi.fn(),
    createAdminClientMock: vi.fn(),
    normalizeNicNacAssistantPartsMock: vi.fn(),
    getOrCreateTradeBoardIntakeContextMock: vi.fn(),
    mergeWorkflowToolIntentsMock: vi.fn(),
    summarizeHardFailDetectionMock: vi.fn(),
    AuthError,
    ServiceError,
  }
})

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return {
    ...actual,
    streamText: (options: unknown) => streamTextMock(options),
  }
})

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError,
  getPaidNicNacContext: getPaidNicNacContextMock,
}))

vi.mock('@/lib/services/errors', () => ({
  ServiceError,
}))

vi.mock('@/lib/nic-nac/persistence', () => ({
  loadCanonicalHistory: loadCanonicalHistoryMock,
  insertUserMessage: insertUserMessageMock,
  reserveAssistantMessage: reserveAssistantMessageMock,
  completeAssistant: completeAssistantMock,
  abortAssistant: abortAssistantMock,
  checkpointAssistant: checkpointAssistantMock,
  recordApprovalEvent: recordApprovalEventMock,
}))

vi.mock('@/lib/nic-nac/tools', () => ({
  buildToolsForIntents: buildToolsForIntentsMock,
  getToolIntentsForMessages: getToolIntentsForMessagesMock,
  shouldRequireToolCallForMessages: shouldRequireToolCallForMessagesMock,
}))

vi.mock('@/lib/nic-nac/prompt-builder', () => ({
  buildNicNacSystemPrompt: buildNicNacSystemPromptMock,
}))

vi.mock('@/lib/nic-nac/probe-conversation-owner', () => ({
  probeConversationOwner: probeConversationOwnerMock,
}))

vi.mock('@/lib/nic-nac/guardian-telemetry', () => ({
  logIncident: logIncidentMock,
  logToolExecution: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/nic-nac/hitl-state', () => ({
  decideAssistantMessageId: decideAssistantMessageIdMock,
}))

vi.mock('@/lib/nic-nac/model-context', () => ({
  selectMessagesForModel: selectMessagesForModelMock,
}))

vi.mock('@/lib/nic-nac/run-telemetry', () => ({
  logNicNacRun: logNicNacRunMock,
  normalizeRunUsage: normalizeRunUsageMock,
}))

vi.mock('@/lib/nic-nac/core/model-policy', () => ({
  getNicNacModelPolicy: getNicNacModelPolicyMock,
}))

vi.mock('@/lib/nic-nac/core/model-provider', () => ({
  getNicNacLanguageModel: getNicNacLanguageModelMock,
  getNicNacProviderOptions: getNicNacProviderOptionsMock,
}))

vi.mock('@/lib/nic-nac/core/model-cost', () => ({
  estimateNicNacRunCostCents: estimateNicNacRunCostCentsMock,
}))

vi.mock('@/lib/nic-nac/core/tool-policy', () => ({
  filterNicNacToolIntentsForContext: filterNicNacToolIntentsForContextMock,
}))

vi.mock('@/lib/nic-nac/core/context-assembler', () => ({
  assembleNicNacContext: assembleNicNacContextMock,
}))

vi.mock('@/lib/nic-nac/core/memory/rep-memory-cards', () => ({
  loadSuiteRepMemoryCards: loadSuiteRepMemoryCardsMock,
}))

vi.mock('@/lib/nic-nac/tool-choice-policy', () => ({
  chooseNicNacToolChoiceForStep: chooseNicNacToolChoiceForStepMock,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/nic-nac/message-normalize', () => ({
  normalizeNicNacAssistantParts: normalizeNicNacAssistantPartsMock,
}))

vi.mock('@/lib/nic-nac/workflows/trade-board-intake-context', () => ({
  getOrCreateTradeBoardIntakeContext: getOrCreateTradeBoardIntakeContextMock,
  mergeWorkflowToolIntents: mergeWorkflowToolIntentsMock,
}))

vi.mock('@/lib/nic-nac/workflows/trade-board-intake-eval', () => ({
  summarizeHardFailDetection: summarizeHardFailDetectionMock,
}))

import { POST } from '@/app/api/nic-nac/route'

function missionRedirectRequest() {
  return new Request('http://localhost/api/nic-nac', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      conversationId: 'conversation-1',
      mode: 'workspace',
      messages: [
        {
          id: 'user-1',
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Make my grocery list for live show snacks.',
            },
          ],
        },
      ],
    }),
  })
}

describe('Suite Nic-Nac mission guard route runtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getPaidNicNacContextMock.mockResolvedValue({
      repId: 'rep-1',
      rep: { auth_user_id: 'user-1' },
      supabase: supabaseMock,
    })
    getNicNacModelPolicyMock.mockReturnValue({
      key: 'human_default',
      provider: 'openai',
      modelId: 'gpt-test',
      reasoning: 'medium',
      purpose: 'test',
    })
    probeConversationOwnerMock.mockResolvedValue(null)
    loadCanonicalHistoryMock.mockResolvedValue([])
    insertUserMessageMock.mockResolvedValue(undefined)
    reserveAssistantMessageMock.mockResolvedValue(undefined)
    completeAssistantMock.mockResolvedValue(undefined)
    logNicNacRunMock.mockResolvedValue(undefined)
  })

  it('persists and streams a mission redirect before memory, workflow, tools, or model setup', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    try {
      const response = await POST(missionRedirectRequest())
      const body = await response.text()
      const assistantMessageId =
        reserveAssistantMessageMock.mock.calls[0]?.[1]?.messageId

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/event-stream')
      expect(response.headers.get('x-nic-nac-run-id')).toEqual(expect.any(String))
      expect(body).toContain(NIC_NAC_MISSION_REDIRECT_MESSAGE)

      expect(insertUserMessageMock).toHaveBeenCalledTimes(1)
      expect(insertUserMessageMock).toHaveBeenCalledWith(
        supabaseMock,
        expect.objectContaining({
          conversationId: 'conversation-1',
          repId: 'rep-1',
          messageId: 'user-1',
        }),
      )
      expect(reserveAssistantMessageMock).toHaveBeenCalledWith(
        supabaseMock,
        expect.objectContaining({
          conversationId: 'conversation-1',
          repId: 'rep-1',
          messageId: assistantMessageId,
        }),
      )
      expect(completeAssistantMock).toHaveBeenCalledWith(
        supabaseMock,
        expect.objectContaining({
          conversationId: 'conversation-1',
          messageId: assistantMessageId,
          parts: [{ type: 'text', text: NIC_NAC_MISSION_REDIRECT_MESSAGE }],
        }),
      )
      expect(logNicNacRunMock).toHaveBeenCalledWith(
        expect.objectContaining({
          repId: 'rep-1',
          conversationId: 'conversation-1',
          model: 'mission_redirect',
          status: 'complete',
          intents: [],
          toolNames: [],
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            estimatedCostCents: 0,
          },
          errorMessage: 'mission_redirect:grocery_list',
        }),
      )

      expect(loadSuiteRepMemoryCardsMock).not.toHaveBeenCalled()
      expect(getOrCreateTradeBoardIntakeContextMock).not.toHaveBeenCalled()
      expect(buildToolsForIntentsMock).not.toHaveBeenCalled()
      expect(streamTextMock).not.toHaveBeenCalled()
      expect(getNicNacLanguageModelMock).not.toHaveBeenCalled()
      expect(getNicNacProviderOptionsMock).not.toHaveBeenCalled()
    } finally {
      infoSpy.mockRestore()
    }
  })
})
