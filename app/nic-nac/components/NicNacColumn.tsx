'use client'

import type { ReactNode } from 'react'
import { NicNacHeader } from './NicNacHeader'
import styles from './NicNacColumn.module.css'

export function NicNacColumn({
  children,
  variant,
  onClose,
  onNewConversation,
  newConversationDisabled,
}: {
  children: ReactNode
  variant: 'desktop' | 'mobile'
  onClose?: () => void
  onNewConversation?: () => void
  newConversationDisabled?: boolean
}) {
  const closeLabel = variant === 'desktop' ? 'Minimize Nic-Nac' : 'Close Nic-Nac'
  return (
    <aside
      id="nic-nac-workspace-chat"
      className={`${styles.column} ${variant === 'mobile' ? styles.mobile : styles.desktop}`}
    >
      <NicNacHeader
        onClose={onClose}
        onNewConversation={onNewConversation}
        newConversationDisabled={newConversationDisabled}
        closeLabel={closeLabel}
      />
      {children}
    </aside>
  )
}
