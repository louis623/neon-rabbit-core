import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  join(process.cwd(), 'lib/services/customer-audience.ts'),
  'utf8',
)

describe('customer signup Message Center source contract', () => {
  it('marks only the public signup write as customer_site_signup', () => {
    const publicSignupStart = source.indexOf('export async function createCustomerAudienceSignup')
    const manualContactStart = source.indexOf('export async function createCustomerAudienceContact')
    const publicSignup = source.slice(publicSignupStart, manualContactStart)
    const manualContact = source.slice(manualContactStart, source.indexOf('export async function updateCustomerAudienceContact'))

    expect(publicSignup).toContain("record_source: 'customer_site_signup'")
    expect(manualContact).not.toContain("record_source: 'customer_site_signup'")
  })
})
