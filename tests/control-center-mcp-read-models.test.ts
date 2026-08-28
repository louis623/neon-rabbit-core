import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { buildOperatorHealthSnapshot } from '@/lib/remy-communications/operator-health'
import { mapControlCenterWaitlistLead } from '@/lib/remy-communications/waitlist'

describe('Control Center MCP read models', () => {
  it('keeps waitlist and health implementations free of database mutation paths', () => {
    for (const path of [
      'lib/remy-communications/waitlist.ts',
      'lib/remy-communications/operator-health.ts',
      'lib/remy-communications/nic-nac-usage.ts',
    ]) {
      const source = readFileSync(path, 'utf8')
      expect(source).not.toContain('.insert(')
      expect(source).not.toContain('.update(')
      expect(source).not.toContain('.upsert(')
      expect(source).not.toContain('.delete(')
      expect(source).not.toContain('.rpc(')
    }
  })

  it('returns the requested waitlist fields without inventing a shop name', () => {
    expect(mapControlCenterWaitlistLead({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Kim',
      email: 'kim@example.test',
      phone: null,
      tiktok_handle: '@kim',
      source: 'prelaunch_site',
      lead_status: 'new',
      intake_submission_id: null,
      created_at: '2026-08-28T12:00:00.000Z',
    }, null)).toEqual({
      leadId: '11111111-1111-4111-8111-111111111111',
      name: 'Kim',
      shopName: null,
      contact: {
        email: 'kim@example.test',
        phone: null,
        tiktokHandle: '@kim',
      },
      signupSource: 'prelaunch_site',
      signupDate: '2026-08-28T12:00:00.000Z',
      status: 'new',
    })
  })

  it('flags operator attention from bounded errors, safety counts, and support spikes', () => {
    const snapshot = buildOperatorHealthSnapshot({
      generatedAt: '2026-08-28T12:00:00.000Z',
      supportLast24Hours: 6,
      supportPrevious24Hours: 2,
      urgentOpenSupport: 1,
      failedSupportNotifications: 1,
      failedSupportAudits: 0,
      failedAgentRunsLast24Hours: 0,
      failedMessageJobs: 1,
      staleMessageJobs: 0,
      failedBroadcasts: 0,
      reportedNetworkSafety: 2,
      activeMessagingSuspensions: 1,
    })

    expect(snapshot.status).toBe('attention')
    expect(snapshot.support.volumeSpikeDetected).toBe(true)
    expect(snapshot.jobsAndSystems.failedMessageJobCount).toBe(1)
    expect(snapshot.safety.reportedNetworkSafetyCount).toBe(2)
    expect(snapshot.redFlagCount).toBe(6)
  })

  it('reports clear when every operator-visible signal is zero', () => {
    const snapshot = buildOperatorHealthSnapshot({
      generatedAt: '2026-08-28T12:00:00.000Z',
      supportLast24Hours: 1,
      supportPrevious24Hours: 1,
      urgentOpenSupport: 0,
      failedSupportNotifications: 0,
      failedSupportAudits: 0,
      failedAgentRunsLast24Hours: 0,
      failedMessageJobs: 0,
      staleMessageJobs: 0,
      failedBroadcasts: 0,
      reportedNetworkSafety: 0,
      activeMessagingSuspensions: 0,
    })

    expect(snapshot.status).toBe('clear')
    expect(snapshot.redFlagCount).toBe(0)
    expect(snapshot.production.suite).toBeNull()
    expect(snapshot.productCounts.suite.supportCreatedLast24Hours).toBe(1)
    expect(snapshot.productCounts.finder.supportCreatedLast24Hours).toBeNull()
  })

  it('adds Suite and Finder production health without removing existing fields', () => {
    const snapshot = buildOperatorHealthSnapshot({
      generatedAt: '2026-08-28T12:00:00.000Z',
      supportLast24Hours: 1,
      supportPrevious24Hours: 1,
      urgentOpenSupport: 0,
      failedSupportNotifications: 0,
      failedSupportAudits: 0,
      failedAgentRunsLast24Hours: 0,
      failedMessageJobs: 0,
      staleMessageJobs: 0,
      failedBroadcasts: 0,
      reportedNetworkSafety: 0,
      activeMessagingSuspensions: 0,
      production: {
        suite: {
          url: 'https://www.yoursparklesuite.com',
          answered: true,
          healthy: true,
          statusCode: 200,
          fiveXx: false,
          checkedAt: '2026-08-28T12:00:00.000Z',
          responseTimeMs: 120,
        },
        finder: {
          url: 'https://yoursparklefinder.com',
          answered: true,
          healthy: false,
          statusCode: 503,
          fiveXx: true,
          checkedAt: '2026-08-28T12:00:00.000Z',
          responseTimeMs: 210,
        },
      },
    })

    expect(snapshot.support.createdLast24Hours).toBe(1)
    expect(snapshot.jobsAndSystems.failedBroadcastCount).toBe(0)
    expect(snapshot.safety.reportedNetworkSafetyCount).toBe(0)
    expect(snapshot.production.suite?.healthy).toBe(true)
    expect(snapshot.production.finder?.fiveXx).toBe(true)
    expect(snapshot.production.failedDeploymentCount).toBeNull()
    expect(snapshot.status).toBe('attention')
    expect(snapshot.redFlagCount).toBe(1)
  })
})
