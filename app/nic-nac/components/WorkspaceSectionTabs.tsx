import type { ComponentType, KeyboardEvent, SVGProps } from 'react'

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

function getFocusableTabs(container: HTMLElement | null) {
  if (!container) return []
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>('button[role="tab"]:not(:disabled)'),
  )
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
        const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
          const { key, currentTarget } = event

          if (
            key !== 'ArrowLeft' &&
            key !== 'ArrowRight' &&
            key !== 'Home' &&
            key !== 'End'
          ) {
            return
          }

          const focusableTabs = getFocusableTabs(currentTarget.parentElement)
          const currentIndex = focusableTabs.indexOf(currentTarget)
          if (currentIndex === -1 || focusableTabs.length === 0) return

          event.preventDefault()

          let nextIndex = currentIndex
          if (key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % focusableTabs.length
          } else if (key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + focusableTabs.length) % focusableTabs.length
          } else if (key === 'Home') {
            nextIndex = 0
          } else if (key === 'End') {
            nextIndex = focusableTabs.length - 1
          }

          const nextTab = focusableTabs[nextIndex]
          const nextKey = nextTab.dataset.sectionKey as TKey | undefined
          if (!nextTab || !nextKey) return

          nextTab.focus()
          onSectionChange(nextKey)
        }

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            data-section-key={tab.key}
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
            onKeyDown={handleKeyDown}
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
