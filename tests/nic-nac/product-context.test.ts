import { describe, expect, it } from 'vitest'
import {
  createSparkleFinderProductContext,
  createSparkleLabProductContext,
  createSuiteOperatorSupportProductContext,
  createSuiteRepWorkspaceProductContext,
} from '@/lib/nic-nac/core/product-context'

describe('Nic-Nac product context', () => {
  it('marks Sparkle Suite workspace reps as allowed to mutate their Suite workspace', () => {
    const context = createSuiteRepWorkspaceProductContext({
      repId: 'suite-rep-1',
      userId: 'auth-user-1',
    })

    expect(context).toMatchObject({
      product: 'sparkle_suite',
      surface: 'rep_workspace',
      actor: {
        type: 'rep',
        suiteRepId: 'suite-rep-1',
        userId: 'auth-user-1',
      },
      permissions: {
        canReadSharedMemory: true,
        canWriteSharedMemory: true,
        canMutateSuiteWorkspace: true,
        canMutateFinderAccount: false,
        canRunSparkleLab: false,
      },
    })
  })

  it('keeps the operator as actor while targeting the rep workspace', () => {
    const context = createSuiteOperatorSupportProductContext({
      targetRepId: 'target-rep',
      targetUserId: 'target-auth',
      operatorRepId: 'operator-rep',
      supportSessionId: 'support-session',
    })

    expect(context).toMatchObject({
      product: 'sparkle_suite',
      surface: 'operator_support_workspace',
      actor: {
        type: 'operator',
        suiteRepId: 'target-rep',
        linkedSuiteRepId: 'target-rep',
        operatorRepId: 'operator-rep',
        supportSessionId: 'support-session',
        subjectUserId: 'target-auth',
      },
      permissions: {
        canMutateSuiteWorkspace: true,
        canMutateFinderAccount: false,
      },
    })
  })

  it('links Sparkle Finder reps to the same Suite rep without granting Suite mutation access', () => {
    const context = createSparkleFinderProductContext({
      finderUserId: 'finder-user-1',
      linkedSuiteRepId: 'suite-rep-1',
      accountTier: 'silver',
    })

    expect(context).toMatchObject({
      product: 'sparkle_finder',
      surface: 'sparkle_finder',
      actor: {
        type: 'rep',
        finderUserId: 'finder-user-1',
        linkedSuiteRepId: 'suite-rep-1',
        accountTier: 'silver',
      },
      permissions: {
        canReadSharedMemory: true,
        canWriteSharedMemory: true,
        canMutateSuiteWorkspace: false,
        canMutateFinderAccount: true,
        canRunSparkleLab: false,
      },
    })
  })

  it('keeps Sparkle Lab separate from production mutation privileges', () => {
    const context = createSparkleLabProductContext({ operatorUserId: 'operator-1' })

    expect(context).toMatchObject({
      product: 'sparkle_lab',
      surface: 'sparkle_lab',
      actor: {
        type: 'operator',
        userId: 'operator-1',
        accountTier: 'operator',
      },
      permissions: {
        canReadSharedMemory: false,
        canWriteSharedMemory: false,
        canMutateSuiteWorkspace: false,
        canMutateFinderAccount: false,
        canRunSparkleLab: true,
      },
    })
  })
})
