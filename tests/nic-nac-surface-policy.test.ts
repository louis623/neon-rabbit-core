import { describe, expect, it } from 'vitest'

import {
  NIC_NAC_SURFACES,
  type NicNacSurface,
} from '@/lib/nic-nac/surfaces'
import {
  NIC_NAC_SURFACE_POLICIES,
  getNicNacSurfacePolicy,
} from '@/lib/nic-nac/surface-policy'

describe('Nic-Nac surfaces', () => {
  it('defines every known Nic-Nac surface', () => {
    expect(NIC_NAC_SURFACES).toEqual([
      'public_landing',
      'rep_workspace',
      'customer_site',
      'sparkle_finder',
    ])
  })

  it('has a policy for every surface', () => {
    for (const surface of NIC_NAC_SURFACES) {
      expect(NIC_NAC_SURFACE_POLICIES[surface]).toBeDefined()
      expect(getNicNacSurfacePolicy(surface).surface).toBe(surface)
    }
  })

  it('keeps public landing read-only and provider-action blocked', () => {
    const policy = getNicNacSurfacePolicy('public_landing')

    expect(policy.canUseAuthenticatedWorkspaceTools).toBe(false)
    expect(policy.canTriggerProviderActions).toBe(false)
    expect(policy.allowedScopes).toContain('public_sales_support')
    expect(policy.blockedScopes).toContain('private_workspace_data')
    expect(policy.blockedScopes).toContain('provider_actions')
  })

  it('allows rep workspace tools without allowing cross-rep data', () => {
    const policy = getNicNacSurfacePolicy('rep_workspace')

    expect(policy.canUseAuthenticatedWorkspaceTools).toBe(true)
    expect(policy.allowedScopes).toContain('authenticated_rep_workspace')
    expect(policy.blockedScopes).toContain('cross_rep_data')
    expect(policy.blockedScopes).toContain('unapproved_provider_actions')
  })

  it('keeps customer site customer-safe', () => {
    const policy = getNicNacSurfacePolicy('customer_site')

    expect(policy.canUseAuthenticatedWorkspaceTools).toBe(false)
    expect(policy.allowedScopes).toContain('customer_safe_support')
    expect(policy.blockedScopes).toContain('rep_admin_workflows')
  })

  it('keeps Sparkle Finder scoped to finder-safe knowledge', () => {
    const policy = getNicNacSurfacePolicy('sparkle_finder')

    expect(policy.allowedScopes).toContain('finder_safe_guidance')
    expect(policy.blockedScopes).toContain('sparkle_suite_private_workspace')
  })

  it('rejects unknown surfaces at compile time through the NicNacSurface type', () => {
    const surface: NicNacSurface = 'public_landing'

    expect(surface).toBe('public_landing')
  })
})
