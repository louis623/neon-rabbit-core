import { describe, expect, it } from 'vitest'

import {
  buildOperatorOnboardingChecklist,
  OPERATOR_ONBOARDING_CHECKLIST_ITEMS,
} from '@/lib/control-center/operator-onboarding-checklist'

describe('operator onboarding checklist', () => {
  it('keeps the five-question About intake as a manual operator step', () => {
    const about = OPERATOR_ONBOARDING_CHECKLIST_ITEMS.find((item) => item.key === 'about_section_intake')
    expect(about?.guidance).toHaveLength(5)
    expect(about?.guidance?.[0]).toContain('How did you discover Bomb Party')
    expect(about?.guidance?.[4]).toContain('What do you want customers to feel')
  })

  it('defaults custom-domain work to not applicable without inferring proof', () => {
    const checklist = buildOperatorOnboardingChecklist()
    expect(checklist.find((item) => item.key === 'custom_domain_dns')?.entry.status).toBe('not_applicable')
    expect(checklist.find((item) => item.key === 'public_route_proof')?.entry.status).toBe('not_started')
  })
})
