import type { ComponentType, SVGProps } from 'react'

import styles from './WorkspaceSectionTabs.module.css'

type WorkspaceSectionIcon = ComponentType<SVGProps<SVGSVGElement>>

export type WorkspaceSectionTab<TKey extends string = string> = {
  key: TKey
  label: string
  shortLabel: string
  subtitle: string
  icon: WorkspaceSectionIcon
  comingSoon?: boolean
}

export function WorkspaceSectionTabs<TKey extends string>({
  tabs,
  activeSection,
  onSectionChange,
}: {
  tabs: readonly WorkspaceSectionTab<TKey>[]
  activeSection: TKey
  onSectionChange: (section: TKey) => void
}) {
  return (
    <nav
      className={styles.workspaceNav}
      role="tablist"
      aria-label="Workspace sections"
    >
      {tabs.map((tab) => {
        const isActiveSection = activeSection === tab.key
        const isComingSoonSection = tab.comingSoon === true
        const Icon = tab.icon

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            className={`${styles.workspaceNavButton} ${
              isActiveSection ? styles.workspaceNavButtonActive : ''
            } ${
              isComingSoonSection ? styles.workspaceNavButtonComingSoon : ''
            }`}
            disabled={isComingSoonSection}
            aria-disabled={isComingSoonSection}
            aria-selected={isActiveSection}
            tabIndex={isActiveSection ? 0 : -1}
            onClick={() => !isComingSoonSection && onSectionChange(tab.key)}
          >
            <Icon className={styles.workspaceNavIcon} aria-hidden="true" />
            <span className={styles.workspaceNavCopy}>
              <span className={styles.workspaceNavLabel}>
                <span className={styles.workspaceNavLabelFull}>{tab.label}</span>
                <span className={styles.workspaceNavLabelShort}>
                  {tab.shortLabel}
                </span>
              </span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
