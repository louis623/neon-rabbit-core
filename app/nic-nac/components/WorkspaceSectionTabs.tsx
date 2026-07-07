import type { ComponentType, KeyboardEvent, SVGProps } from 'react'

import styles from './WorkspaceSectionTabs.module.css'

type WorkspaceSectionIcon = ComponentType<SVGProps<SVGSVGElement>>

export type WorkspaceSectionTab<TKey extends string = string> = {
  key: TKey
  label: string
  shortLabel: string
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
    <nav className={styles.tabs} role="tablist" aria-label="Workspace sections">
      {tabs.map((tab) => {
        const active = activeSection === tab.key
        const isComingSoon = tab.comingSoon === true
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
            className={`${active ? styles.tabActive : styles.tab} ${
              isComingSoon ? styles.tabComingSoon : ''
            }`}
            disabled={isComingSoon}
            aria-disabled={isComingSoon}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => !isComingSoon && onSectionChange(tab.key)}
            onKeyDown={handleKeyDown}
          >
            <Icon className={styles.icon} aria-hidden="true" />
            <span className={styles.labelFull}>{tab.label}</span>
            <span className={styles.labelShort}>{tab.shortLabel}</span>
          </button>
        )
      })}
    </nav>
  )
}
