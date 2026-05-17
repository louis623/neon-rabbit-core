import { describe, expect, it } from 'vitest'

import {
  buildPrelaunchWaitlistInsert,
  validatePrelaunchWaitlistInput,
} from '@/lib/prelaunch/waitlist'
import { ServiceError } from '@/lib/services/errors'

describe('validatePrelaunchWaitlistInput', () => {
  it('accepts and normalizes the approved fields', () => {
    const result = validatePrelaunchWaitlistInput({
      name: ' Jamie Hart ',
      email: ' JAMIE@EXAMPLE.COM ',
      phone: ' (303) 555-0123 ',
      tiktokHandle: ' jamieh ',
      teamRepName: ' Lindsey ',
      setupPain: ' Too many links and DMs ',
      smsConsent: true,
      emailConsent: true,
    })

    expect(result).toEqual({
      name: 'Jamie Hart',
      email: 'jamie@example.com',
      phone: '(303) 555-0123',
      tiktokHandle: '@jamieh',
      teamRepName: 'Lindsey',
      setupPain: 'Too many links and DMs',
      smsConsent: true,
      emailConsent: true,
    })
  })

  it('allows joining the waitlist by email without optional SMS consent', () => {
    const result = validatePrelaunchWaitlistInput({
      name: 'Jamie Hart',
      email: 'jamie@example.com',
      phone: '',
      tiktokHandle: '@jamieh',
      teamRepName: 'Lindsey',
      smsConsent: false,
      emailConsent: true,
    })

    expect(result).toMatchObject({
      phone: '',
      smsConsent: false,
      emailConsent: true,
    })
  })

  it('requires a phone number only when SMS consent is selected', () => {
    expect(() =>
      validatePrelaunchWaitlistInput({
        name: 'Jamie Hart',
        email: 'jamie@example.com',
        phone: '',
        tiktokHandle: '@jamieh',
        teamRepName: 'Lindsey',
        smsConsent: true,
        emailConsent: true,
      }),
    ).toThrow(ServiceError)
  })

  it('builds the Supabase insert payload without exposing client-only field names', () => {
    const insert = buildPrelaunchWaitlistInsert({
      name: 'Jamie Hart',
      email: 'jamie@example.com',
      phone: '303-555-0123',
      tiktokHandle: '@jamieh',
      teamRepName: 'Lindsey',
      setupPain: '',
      smsConsent: true,
      emailConsent: true,
    })

    expect(insert).toEqual({
      name: 'Jamie Hart',
      email: 'jamie@example.com',
      phone: '303-555-0123',
      tiktok_handle: '@jamieh',
      team_rep_name: 'Lindsey',
      setup_pain: null,
      sms_consent: true,
      email_consent: true,
      source: 'prelaunch_site',
    })
  })

  it('builds an email-only waitlist insert with no phone or SMS consent', () => {
    const insert = buildPrelaunchWaitlistInsert({
      name: 'Jamie Hart',
      email: 'jamie@example.com',
      phone: '',
      tiktokHandle: '@jamieh',
      teamRepName: 'Lindsey',
      setupPain: '',
      smsConsent: false,
      emailConsent: true,
    })

    expect(insert).toMatchObject({
      phone: null,
      sms_consent: false,
      email_consent: true,
    })
  })
})
