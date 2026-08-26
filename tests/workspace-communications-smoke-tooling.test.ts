import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  assertSyntheticCommunicationsEmail,
  makeCommunicationsSmokeEmail,
} from '@/scripts/workspace-communications-smoke-helpers'

const workspaceScript = readFileSync('scripts/smoke-workspace-conversations.ts', 'utf8')
const supportScript = readFileSync('scripts/smoke-support-conversation.ts', 'utf8')
const networkScript = readFileSync('scripts/smoke-rep-network-messaging.ts', 'utf8')
const helper = readFileSync('scripts/workspace-communications-smoke-helpers.ts', 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>
}

describe('unified communications synthetic smoke tooling', () => {
  it('accepts only the dedicated sparkle-reviewer+ communications identity namespace', () => {
    expect(makeCommunicationsSmokeEmail('Run 123', 'Peer 1')).toBe(
      'sparkle-reviewer+communications-run123-peer1@neonrabbit.net',
    )
    expect(() => assertSyntheticCommunicationsEmail('louis@neonrabbit.net')).toThrow(
      'Communications smoke identities must use',
    )
    expect(() => assertSyntheticCommunicationsEmail('customer@example.com')).toThrow(
      'Communications smoke identities must use',
    )
  })

  it('exposes focused smoke and reset commands', () => {
    expect(packageJson.scripts['smoke:workspace-conversations']).toBe(
      'tsx --conditions=react-server scripts/smoke-workspace-conversations.ts',
    )
    expect(packageJson.scripts['smoke:support-conversation']).toBe(
      'tsx --conditions=react-server scripts/smoke-support-conversation.ts',
    )
    expect(packageJson.scripts['smoke:rep-network-messaging']).toBe(
      'tsx --conditions=react-server scripts/smoke-rep-network-messaging.ts',
    )
    expect(packageJson.scripts['smoke:workspace-communications:reset']).toContain(
      '--reset-only',
    )
  })

  it('makes cleanup mandatory and avoids notification-provider workflows', () => {
    for (const script of [workspaceScript, supportScript, networkScript]) {
      expect(script).toContain('runWithRequiredCleanup')
      expect(script).toContain('resetAllCommunicationsSmokeFixtures')
      expect(script).not.toContain('louis@neonrabbit.net')
      expect(script).not.toContain('sendGoogleChat')
    }
    expect(supportScript).toContain('providerNotificationsTriggered: false')
    expect(supportScript).toContain("admin.rpc('create_workspace_support_submission'")
  })

  it('cleans external objects and reverse dependencies before identities', () => {
    const storage = helper.indexOf(".from('workspace-support-attachments')")
    const tasks = helper.indexOf(".from('sparkle_suite_bug_hunt_items').delete()")
    const reports = helper.indexOf(".from('support_reports').delete()")
    const audits = helper.indexOf(".from('workspace_conversation_audit_events').delete()")
    const conversations = helper.indexOf(".from('workspace_conversations').delete()")
    const reps = helper.indexOf(".from('reps').delete()")
    const auth = helper.indexOf('admin.auth.admin.deleteUser(authUserId)')
    expect([storage, tasks, reports, audits, conversations, reps, auth].every((index) => index >= 0)).toBe(true)
    expect(storage).toBeLessThan(tasks)
    expect(tasks).toBeLessThan(reports)
    expect(reports).toBeLessThan(audits)
    expect(audits).toBeLessThan(conversations)
    expect(conversations).toBeLessThan(reps)
    expect(reps).toBeLessThan(auth)
  })
})
