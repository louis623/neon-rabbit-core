import { describe, expect, it } from 'vitest'
import { isCalendarReadQueryText } from '@/lib/nic-nac/calendar-read-intent'

describe('Calendar read intent', () => {
  it.each([
    'Hey Nic-Nac, do I have anything on my calendar right now?',
    "What's on my schedule this week?",
    'Whats on my calendar',
    'What’s on my calendar?',
    'Whens my next show?',
    'When is my next live?',
    'Do I have a show tonight?',
    'What events did I have last month?',
    'How many shows are coming up?',
    'Am I scheduled to go live tomorrow?',
    'Check my calendar for next week.',
  ])('recognizes natural Calendar lookup wording: %s', (text) => {
    expect(isCalendarReadQueryText(text)).toBe(true)
  })

  it.each([
    'Add a show to my calendar Friday.',
    "Move Friday's show to Saturday.",
    'Cancel my next show.',
    'Text customers before every show.',
    'I always go live Friday.',
  ])('does not misclassify Calendar mutations or statements: %s', (text) => {
    expect(isCalendarReadQueryText(text)).toBe(false)
  })
})
