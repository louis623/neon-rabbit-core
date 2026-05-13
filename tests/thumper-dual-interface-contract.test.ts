import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DUAL_INTERFACE_CONTRACTS } from '@/lib/thumper/dual-interface-contract'

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('Thumper/dashboard dual-interface contracts', () => {
  it('keeps every parity contract wired to the same service function from route and tool surfaces', () => {
    expect(DUAL_INTERFACE_CONTRACTS.length).toBeGreaterThanOrEqual(10)

    for (const contract of DUAL_INTERFACE_CONTRACTS) {
      const routeSource = read(contract.routeFile)

      for (const method of contract.routeMethods) {
        expect(routeSource).toContain(`export async function ${method}`)
      }
      for (const serviceFunction of contract.serviceFunctions) {
        expect(routeSource).toContain(serviceFunction)
      }

      if (contract.toolFile) {
        const toolSource = read(contract.toolFile)
        for (const serviceFunction of contract.serviceFunctions) {
          expect(toolSource).toContain(serviceFunction)
        }
        expect(toolSource).not.toMatch(/\brepId\s*:\s*z\./)
        expect(toolSource).not.toMatch(/\brep_id\s*:\s*z\./i)
      }
    }
  })

  it('does not let route payloads or query strings override the authenticated rep identity', () => {
    for (const contract of DUAL_INTERFACE_CONTRACTS) {
      const routeSource = read(contract.routeFile)

      expect(routeSource).not.toMatch(/body\?\.(repId|rep_id)/)
      expect(routeSource).not.toMatch(/searchParams\.get\(['"`](repId|rep_id)['"`]\)/)
    }
  })

  it('documents which contracts intentionally use service-role clients', () => {
    const adminContracts = DUAL_INTERFACE_CONTRACTS.filter(
      (contract) => contract.clientMode === 'service_role',
    )

    expect(adminContracts.map((contract) => contract.id).sort()).toEqual([
      'jewelry.add-from-library',
      'jewelry.search',
      'trade-board.add',
      'trade-requests.approve',
      'trade-requests.reject',
    ])
  })
})
