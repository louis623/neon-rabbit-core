import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { LaunchSmokeTarget } from '@/scripts/smoke-demo-readiness'

export type RenderedSmokeViewport = 'mobile' | 'desktop'
export type RenderedSmokeConsoleLevel = 'error' | 'warn' | 'warning'

export interface RenderedSmokeChecks {
  pageIdentity: boolean
  notBlank: boolean
  noFrameworkOverlay: boolean
  noHorizontalOverflow: boolean
  noCorruptedCharacters: boolean
  consoleHealthy: boolean
}

export interface RenderedSmokeConsoleMessage {
  level: RenderedSmokeConsoleLevel
  message: string
  expected: boolean
}

export interface RenderedSmokeInteraction {
  label: string
  ok: boolean
  detail: string
}

export interface RenderedSmokeRouteInput {
  route: string
  viewport: RenderedSmokeViewport
  width: number
  height: number
  title: string
  finalUrl: string
  checks: RenderedSmokeChecks
  consoleMessages: RenderedSmokeConsoleMessage[]
  interaction: RenderedSmokeInteraction | null
}

export interface RenderedSmokeRouteResult extends RenderedSmokeRouteInput {
  ok: boolean
}

export interface RenderedMobileSmokeArtifactSummary {
  total: number
  passed: number
  failed: number
  expectedWarnings: number
  unexpectedConsoleMessages: number
}

export interface RenderedMobileSmokeArtifact {
  generatedAt: string
  target: LaunchSmokeTarget
  baseUrl: string
  ok: boolean
  routes: string[]
  summary: RenderedMobileSmokeArtifactSummary
  results: RenderedSmokeRouteResult[]
}

export interface BuildRenderedMobileSmokeArtifactInput {
  generatedAt?: Date
  target?: LaunchSmokeTarget
  baseUrl: string
  routes: RenderedSmokeRouteInput[]
}

export interface WriteRenderedMobileSmokeArtifactOptions {
  outputDir?: string
}

function inferTarget(baseUrl: string): LaunchSmokeTarget {
  return /localhost|127\.0\.0\.1|\[::1\]/i.test(baseUrl) ? 'local' : 'preview'
}

function hasRequiredRouteChecks(checks: RenderedSmokeChecks): boolean {
  return (
    checks.pageIdentity &&
    checks.notBlank &&
    checks.noFrameworkOverlay &&
    checks.noHorizontalOverflow &&
    checks.noCorruptedCharacters &&
    checks.consoleHealthy
  )
}

function hasUnexpectedConsoleMessages(route: RenderedSmokeRouteInput): boolean {
  return route.consoleMessages.some((message) => !message.expected)
}

function routeOk(route: RenderedSmokeRouteInput): boolean {
  return (
    hasRequiredRouteChecks(route.checks) &&
    !hasUnexpectedConsoleMessages(route) &&
    route.interaction?.ok !== false
  )
}

function uniqueRoutes(routes: RenderedSmokeRouteInput[]) {
  return Array.from(new Set(routes.map((route) => route.route)))
}

export function buildRenderedMobileSmokeArtifact(
  input: BuildRenderedMobileSmokeArtifactInput,
): RenderedMobileSmokeArtifact {
  const results = input.routes.map((route) => ({
    ...route,
    ok: routeOk(route),
  }))
  const expectedWarnings = results.reduce(
    (count, route) =>
      count +
      route.consoleMessages.filter((message) => message.expected).length,
    0,
  )
  const unexpectedConsoleMessages = results.reduce(
    (count, route) =>
      count +
      route.consoleMessages.filter((message) => !message.expected).length,
    0,
  )
  const passed = results.filter((result) => result.ok).length

  return {
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    target: input.target ?? inferTarget(input.baseUrl),
    baseUrl: input.baseUrl,
    ok: results.every((result) => result.ok),
    routes: uniqueRoutes(input.routes),
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
      expectedWarnings,
      unexpectedConsoleMessages,
    },
    results,
  }
}

export async function writeRenderedMobileSmokeArtifact(
  artifact: RenderedMobileSmokeArtifact,
  options: WriteRenderedMobileSmokeArtifactOptions = {},
): Promise<string> {
  const outputDir =
    options.outputDir ?? path.join('.local', 'launch-readiness-results')
  await mkdir(outputDir, { recursive: true })
  const safeTimestamp = artifact.generatedAt.replace(/[:.]/g, '-')
  const outputPath = path.join(
    outputDir,
    `rendered-mobile-${artifact.target}-${safeTimestamp}.json`,
  )
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8')
  return outputPath
}
