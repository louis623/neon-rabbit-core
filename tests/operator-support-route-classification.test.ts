import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  isOperatorSupportGatewayClassificationAllowed,
  OPERATOR_SUPPORT_HTTP_METHODS,
  OPERATOR_SUPPORT_PROVIDER_ROUTE_ROOTS,
  OPERATOR_SUPPORT_ROUTE_CLASSIFICATIONS,
  OPERATOR_SUPPORT_ROUTE_INVENTORY,
  OPERATOR_SUPPORT_ROUTE_INVENTORY_ROOTS,
  type OperatorSupportHttpMethod,
} from '@/lib/operator-support/route-classification'

function normalizePath(value: string) {
  return value.replaceAll('\\', '/')
}

function listRouteFiles(directory: string): string[] {
  const absoluteDirectory = resolve(process.cwd(), directory)
  if (!existsSync(absoluteDirectory)) return []

  return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const child = `${directory}/${entry.name}`
    if (entry.isDirectory()) return listRouteFiles(child)
    return entry.isFile() && /^route\.(?:ts|js|tsx|jsx|mts|mjs)$/.test(entry.name)
      ? [normalizePath(child)]
      : []
  })
}

function routePathFromFile(file: string) {
  return `/${file
    .replace(/^app\//, '')
    .replace(/\/route\.(?:ts|js|tsx|jsx|mts|mjs)$/, '')}`
}

function exportedHttpMethods(file: string): OperatorSupportHttpMethod[] {
  const source = readFileSync(resolve(process.cwd(), file), 'utf8')
  const methodPattern =
    /export\s+(?:(?:async\s+)?function\s+|const\s+)(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g
  return [...source.matchAll(methodPattern)].map(
    (match) => match[1] as OperatorSupportHttpMethod,
  )
}

describe('operator support route classification manifest', () => {
  it('allows only explicit support read and write classifications through the gateway', () => {
    expect(isOperatorSupportGatewayClassificationAllowed('support_allowed_read')).toBe(true)
    expect(isOperatorSupportGatewayClassificationAllowed('support_allowed_write')).toBe(true)
    expect(isOperatorSupportGatewayClassificationAllowed('not_applicable')).toBe(false)
    expect(isOperatorSupportGatewayClassificationAllowed('rep_only')).toBe(false)
    expect(isOperatorSupportGatewayClassificationAllowed('support_blocked_sensitive')).toBe(false)
    expect(isOperatorSupportGatewayClassificationAllowed(undefined)).toBe(false)
  })

  it('classifies every governed route and no removed route', () => {
    const discovered = OPERATOR_SUPPORT_ROUTE_INVENTORY_ROOTS.flatMap(listRouteFiles).sort()
    const classified = OPERATOR_SUPPORT_ROUTE_INVENTORY.map((entry) => entry.file).sort()

    expect(classified).toEqual(discovered)
  })

  it('keeps file, URL pattern, and exported methods synchronized', () => {
    for (const entry of OPERATOR_SUPPORT_ROUTE_INVENTORY) {
      expect(entry.path, entry.file).toBe(routePathFromFile(entry.file))
      expect(entry.methods, entry.file).toEqual(exportedHttpMethods(entry.file))
      expect(OPERATOR_SUPPORT_ROUTE_CLASSIFICATIONS).toContain(entry.classification)
      for (const method of entry.methods) {
        expect(OPERATOR_SUPPORT_HTTP_METHODS, `${entry.file} exports ${method}`).toContain(method)
      }
    }
  })

  it('has one unique entry for every file and URL pattern', () => {
    const files = OPERATOR_SUPPORT_ROUTE_INVENTORY.map((entry) => entry.file)
    const paths = OPERATOR_SUPPORT_ROUTE_INVENTORY.map((entry) => entry.path)

    expect(new Set(files).size).toBe(files.length)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('does not mark provider, billing, auth, outbound, or export routes as support allowed', () => {
    const sensitiveFiles = new Set([
      'app/api/account/activate-trial/route.ts',
      'app/api/auth/callback/route.ts',
      'app/api/nic-nac/account-billing/route.ts',
      'app/api/nic-nac/customer-audience/route.ts',
      'app/api/nic-nac/send-email/route.ts',
      'app/api/nic-nac/wallet-summary/route.ts',
      'app/api/nic-nac/messages/route.ts',
      'app/api/nic-nac/conversations/[conversationId]/messages/route.ts',
      'app/api/nic-nac/team-onboarding/participants/[participantId]/messages/route.ts',
      'app/api/self-serve/signup/route.ts',
    ])

    for (const entry of OPERATOR_SUPPORT_ROUTE_INVENTORY) {
      const isProviderRoute = OPERATOR_SUPPORT_PROVIDER_ROUTE_ROOTS.some((root) =>
        entry.file.startsWith(`${root}/`),
      )
      if (isProviderRoute || sensitiveFiles.has(entry.file)) {
        expect(entry.classification, entry.file).toBe('support_blocked_sensitive')
      }
    }
  })

  it('limits support read classifications to non-mutating handlers', () => {
    const mutatingMethods = new Set<OperatorSupportHttpMethod>([
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ])

    for (const entry of OPERATOR_SUPPORT_ROUTE_INVENTORY) {
      if (entry.classification !== 'support_allowed_read') continue
      expect(
        entry.methods.some((method) => mutatingMethods.has(method)),
        entry.file,
      ).toBe(false)
    }
  })

  it('requires an explicit capability on every planned support route', () => {
    for (const entry of OPERATOR_SUPPORT_ROUTE_INVENTORY) {
      if (!entry.classification.startsWith('support_allowed_')) continue
      expect(
        ('capabilities' in entry ? entry.capabilities.length : 0),
        entry.file,
      ).toBeGreaterThan(0)
    }
  })
})
