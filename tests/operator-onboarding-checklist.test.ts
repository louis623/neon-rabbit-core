import { describe, expect, it } from 'vitest'
import { buildOperatorOnboardingChecklist, OPERATOR_ONBOARDING_CHECKLIST_ITEMS } from '@/lib/control-center/operator-onboarding-checklist'

describe('operator onboarding checklist', () => {
  it('keeps the five-question About intake in a simple manual checklist item', () => {
    const about = OPERATOR_ONBOARDING_CHECKLIST_ITEMS.find((item) => item.key === 'about_section_intake')
    expect(about?.guidance).toHaveLength(5)
    expect(about?.guidance?.[0]).toContain('How did you discover Bomb Party')
    expect(about?.guidance?.[4]).toContain('What do you want customers to feel')
  })
  it('starts every checklist item unchecked', () => {
    expect(buildOperatorOnboardingChecklist().every((item) => item.entry.isCompleted === false)).toBe(true)
  })
})
