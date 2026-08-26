import { BadgeCheck, Headphones, Network, Users } from 'lucide-react'
import type { WorkspaceInboxItem } from './types'
import { isConversationItem } from './types'
import styles from './MessageCenter.module.css'

export function formatMessageDate(value?: string | null) {
  if (!value) return 'Time unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time unavailable'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function getInboxItemPresentation(item: WorkspaceInboxItem) {
  if (!isConversationItem(item)) {
    return {
      identity: item.senderDisplayName || 'Sparkle Suite',
      typeLabel: 'Official update',
      subject: item.title || item.subject || 'Sparkle Suite update',
      preview: item.summary || (typeof item.body === 'string' ? item.body : ''),
      date: item.deliveredAt || item.createdAt || null,
      unread: !item.isRead,
      archived: Boolean(item.archivedAt),
      icon: BadgeCheck,
    }
  }

  const type = {
    team_onboarding: { label: 'Team', icon: Users },
    support: { label: 'Sparkle Suite Support', icon: Headphones },
    rep_direct: { label: 'Rep Network', icon: Network },
  }[item.conversationType]

  return {
    identity: item.senderDisplayName,
    typeLabel: type.label,
    subject: item.subject,
    preview: item.latestMessagePreview || 'Open the conversation to read more.',
    date: item.lastMessageAt || item.createdAt || null,
    unread: item.unreadCount > 0 || item.isRead === false,
    archived: Boolean(item.archivedAt),
    icon: type.icon,
  }
}

export function InboxItem({
  item,
  selected,
  onOpen,
}: {
  item: WorkspaceInboxItem
  selected: boolean
  onOpen: () => void
}) {
  const presentation = getInboxItemPresentation(item)
  const Icon = presentation.icon
  const dateTime = presentation.date ?? undefined
  const isPendingRequest =
    isConversationItem(item) &&
    item.conversationType === 'rep_direct' &&
    item.requestState === 'pending' &&
    item.requestDirection === 'incoming'

  return (
    <button
      type="button"
      className={`${styles.inboxItem} ${
        selected ? styles.inboxItemSelected : ''
      } ${presentation.unread ? styles.inboxItemUnread : ''}`}
      onClick={onOpen}
      aria-current={selected ? 'true' : undefined}
      aria-label={`${presentation.unread ? 'Unread' : 'Read'} ${presentation.typeLabel} message: ${presentation.subject}`}
    >
      <span className={styles.inboxIcon} aria-hidden="true">
        <Icon />
      </span>
      <span className={styles.inboxCopy}>
        <span className={styles.inboxTopLine}>
          <strong>{presentation.identity}</strong>
          <time dateTime={dateTime}>{formatMessageDate(dateTime)}</time>
        </span>
        <span className={styles.inboxMetaLine}>
          <span className={styles.typeLabel}>{presentation.typeLabel}</span>
          {isPendingRequest ? (
            <span className={styles.requestLabel}>Message request</span>
          ) : null}
          {presentation.unread ? (
            <span className={styles.unreadLabel}>Unread</span>
          ) : null}
        </span>
        <span className={styles.inboxSubject}>{presentation.subject}</span>
        <span className={styles.inboxPreview}>{presentation.preview}</span>
      </span>
    </button>
  )
}
