import { describe, expect, it } from 'vitest'
import {
  classifyNicNacMissionScopeForText,
  NIC_NAC_MISSION_REDIRECT_MESSAGE,
} from '@/lib/nic-nac/core/mission-guard'

describe('Nic-Nac mission guard', () => {
  it.each([
    ['Can you be my therapist and help me process my marriage?', 'therapist'],
    ['Can you be my therapist for rep burnout?', 'therapist'],
    ['Make my grocery list for the week.', 'grocery_list'],
    ['Make a grocery list for my live show snacks.', 'grocery_list'],
    ['Write a 1000 word history essay about the Roman Empire.', 'homework_or_content'],
    ['Plan my beach vacation itinerary.', 'travel_planning'],
    ['Diagnose this rash from a photo.', 'medical_advice'],
    ['Review this legal contract for my jewelry customer.', 'legal_or_financial_advice'],
  ])('redirects clear off-mission requests: %s', (text, reason) => {
    expect(classifyNicNacMissionScopeForText(text)).toEqual({
      action: 'redirect',
      reason,
      message: NIC_NAC_MISSION_REDIRECT_MESSAGE,
    })
  })

  it.each([
    'Can you build a weekly budget for my Bomb Party business?',
    'Help me set up OBS and TikTok Live for my next BP show.',
    'Please update my BlingKitchen recipe copy on the customer site.',
    'Write a caption for my live show after a rough day.',
    'I am overwhelmed with my show setup. Help me make a checklist.',
    'Which July Birthday 2026 earrings are on my Trade Board?',
  ])('allows mission-related requests: %s', (text) => {
    expect(classifyNicNacMissionScopeForText(text)).toEqual({
      action: 'allow',
    })
  })

  it.each([
    'Hey Nic-Nac, how are you?',
    'Tell me a quick joke before we start.',
    'Are you really a Virgo?',
  ])('allows light small talk without spending tools: %s', (text) => {
    expect(classifyNicNacMissionScopeForText(text)).toEqual({
      action: 'allow',
    })
  })
})
