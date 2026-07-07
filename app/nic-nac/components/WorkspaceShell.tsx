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
    <div className={styles.shell}>
      {header ? <div className={styles.header}>{header}</div> : null}
      <div className={styles.tabsWrap}>
        <WorkspaceSectionTabs
          tabs={tabs}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
      </div>
      <section className={styles.content}>
        {notice}
        {children}
      </section>
    </div>
  )
}
