import { describe, expect, it } from 'vitest'
import { remyMcpToolNames } from '@/lib/remy-communications/mcp'

describe('Remy Communications MCP contract', () => {
  it('exposes only read/draft tools plus a one-time approved-reply path', () => {
    expect(remyMcpToolNames).toEqual([
      'communications_get_inbox_summary',
      'communications_list_support_reports',
      'communications_get_support_report',
      'communications_list_network_safety_queue',
      'communications_list_broadcasts',
      'communications_draft_support_reply',
      'communications_request_support_reply_approval',
      'communications_send_approved_support_reply',
      'communications_draft_broadcast',
      'communications_draft_task_candidate',
    ])
    expect(remyMcpToolNames).not.toContain('communications_publish_broadcast')
    expect(remyMcpToolNames).not.toContain('communications_moderate_network')
    expect(remyMcpToolNames).not.toContain('communications_change_support_status')
  })
})
