import type { ReactNode } from 'react'

import {
  WorkspaceSectionTabs,
  type WorkspaceSectionTab,
} from './WorkspaceSectionTabs'
import styles from './WorkspaceShell.module.css'

export function WorkspaceShell<TKey extends string>({
  tabs,
  activeSection,
  onSectionChange,
  header,
  notice,
  children,
}: {
  tabs: readonly WorkspaceSectionTab<TKey>[]
  activeSection: TKey
  onSectionChange: (section: TKey) => void
  header?: ReactNode
  notice?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      {header}
      <div className={styles.workspaceShell}>
        <div className={styles.workspaceSidebar}>
          <WorkspaceSectionTabs
            tabs={tabs}
            activeSection={activeSection}
            onSectionChange={onSectionChange}
          />
        </div>
        <section className={styles.workspaceContent}>
          {notice}
          {children}
        </section>
      </div>
    </>
  )
}
