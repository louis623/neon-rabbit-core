import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ControlCenterCommunicationsNav } from '@/app/control-center/_components/ControlCenterCommunicationsNav'
import { SupportConversationDetail } from '@/app/control-center/_components/SupportConversationDetail'
import { SupportCommandCenter } from '@/app/control-center/_components/SupportCommandCenter'
import { RepNetworkModerationPanel } from '@/app/control-center/_components/RepNetworkModerationPanel'

describe('Control Center unified communications UI', () => {
  it('presents three plain-language operator views', () => {
    const html = renderToStaticMarkup(
      createElement(ControlCenterCommunicationsNav, { active: 'support' }),
    )
    expect(html).toContain('Support Inbox')
    expect(html).toContain('Broadcasts')
    expect(html).toContain('Network Safety')
    expect(html).toContain('aria-current="page"')
  })

  it('keeps private notes out of the rep-visible support thread', () => {
    const html = renderToStaticMarkup(
      createElement(SupportConversationDetail, {
        detail: {
          conversation: {
            id: '00000000-0000-4000-8000-000000000001',
            type: 'support',
            state: 'open',
            subject: 'Dance Floor will not load',
            updatedAt: '2026-08-26T12:00:00.000Z',
            participantLabels: ['Avery Sparkles'],
          },
          messages: [
            {
              id: 'message-1',
              senderType: 'rep',
              senderLabel: 'Avery Sparkles',
              body: 'The page stays blank.',
              createdAt: '2026-08-26T12:00:00.000Z',
            },
            {
              id: 'private-note',
              senderType: 'operator',
              senderLabel: 'Louis',
              body: 'PRIVATE ROOT CAUSE NOTE',
              createdAt: '2026-08-26T12:05:00.000Z',
              isInternal: true,
            },
          ],
          attachments: [
            {
              id: '00000000-0000-4000-8000-000000000003',
              contentType: 'image/png',
              byteSize: 524288,
              width: 1200,
              height: 800,
              slot: 1,
              createdAt: '2026-08-26T12:01:00.000Z',
              signedReadHref:
                '/api/control-center/conversations/00000000-0000-4000-8000-000000000001/attachments/00000000-0000-4000-8000-000000000003',
            },
          ],
          supportReport: {
            id: '00000000-0000-4000-8000-000000000002',
            status: 'reviewing',
            reportType: 'bug',
            urgency: 'normal',
            title: 'Dance Floor will not load',
            createdAt: '2026-08-26T12:00:00.000Z',
          },
        },
        onChanged: () => undefined,
      }),
    )
    expect(html).toContain('Reply as Sparkle Suite Support')
    expect(html).toContain('Rep-visible status')
    expect(html).toContain('Promote to Task List')
    expect(html).toContain('Private screenshots (1)')
    expect(html).toContain('Open screenshot 1')
    expect(html).not.toContain('storage.googleapis.com')
    expect(html).toContain('The page stays blank.')
    expect(html).not.toContain('PRIVATE ROOT CAUSE NOTE')
  })

  it('replaces the duplicate home-page ticket editor with one summary link', () => {
    const html = renderToStaticMarkup(
      createElement(SupportCommandCenter, {
        customers: [],
        reports: [
          {
            id: 'report-1',
            status: 'open',
            title: 'Example report',
          },
        ],
        waitlist: [],
        bugHuntItems: [],
      }),
    )
    expect(html).toContain('Support conversations')
    expect(html).toContain('Open Support Inbox')
    expect(html).toContain('/control-center/messages?view=support')
    expect(html).not.toContain('Report Detail')
    expect(html).not.toContain('Recommended first action')
  })

  it('keeps safety review and messaging suspensions in one operator view', () => {
    const html = renderToStaticMarkup(createElement(RepNetworkModerationPanel))
    expect(html).toContain('Network Safety')
    expect(html).toContain('Reported conversations')
    expect(html).toContain('Messaging suspensions')
    expect(html).toContain('Ordinary private rep conversations do not appear here')
  })
})
