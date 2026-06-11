import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { config } from 'dotenv'
import Stripe from 'stripe'

export const STRIPE_LIVE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.expired',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
] as const

type StripeWebhookEndpointSummary = {
  id: string
  url: string
  status: string | null
  enabled_events: string[]
  secret?: string | null
}

export interface StripeLiveWebhookEndpointClient {
  list(input: { limit: number }): Promise<{ data: StripeWebhookEndpointSummary[] }>
  create(input: {
    url: string
    enabled_events: Stripe.WebhookEndpointCreateParams.EnabledEvent[]
    description: string
    metadata: Record<string, string>
  }): Promise<StripeWebhookEndpointSummary>
  update(
    id: string,
    input: {
      enabled_events: Stripe.WebhookEndpointUpdateParams.EnabledEvent[]
      description: string
      metadata: Record<string, string>
    },
  ): Promise<StripeWebhookEndpointSummary>
}

export interface EnsureStripeLiveWebhookEndpointOptions {
  targetUrl: string
  apply: boolean
  approvedAt?: string
  writeSecretFile?: string | null
  now?: Date
}

export interface EnsureStripeLiveWebhookEndpointResult {
  ok: boolean
  mode: 'dry_run' | 'apply'
  action: 'create' | 'update' | 'none'
  targetUrl: string
  targetHost: string
  endpointMatched: boolean
  endpointStatus: string | null
  missingEvents: string[]
  endpointIdPresent: boolean
  secretAvailable: boolean
  secretWritten: boolean
}

interface ParsedArgs {
  targetUrl?: string
  envFile?: string
  apply: boolean
  approvedAt?: string
  writeSecretFile?: string
  json: boolean
}

function readNextValue(args: string[], index: number) {
  const value = args[index + 1]?.trim()
  return value || undefined
}

function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = { apply: false, json: false }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--apply') {
      parsed.apply = true
      continue
    }
    if (arg === '--json') {
      parsed.json = true
      continue
    }
    if (arg === '--target' || arg === '--target-url' || arg === '--url') {
      parsed.targetUrl = readNextValue(args, index)
      index += 1
      continue
    }
    if (arg === '--env-file' || arg === '--dotenv') {
      parsed.envFile = readNextValue(args, index)
      index += 1
      continue
    }
    if (arg === '--approved-at') {
      parsed.approvedAt = readNextValue(args, index)
      index += 1
      continue
    }
    if (arg === '--write-secret-file') {
      parsed.writeSecretFile = readNextValue(args, index)
      index += 1
      continue
    }
    if (arg.startsWith('--target=')) parsed.targetUrl = arg.slice('--target='.length)
    if (arg.startsWith('--target-url=')) parsed.targetUrl = arg.slice('--target-url='.length)
    if (arg.startsWith('--url=')) parsed.targetUrl = arg.slice('--url='.length)
    if (arg.startsWith('--env-file=')) parsed.envFile = arg.slice('--env-file='.length)
    if (arg.startsWith('--dotenv=')) parsed.envFile = arg.slice('--dotenv='.length)
    if (arg.startsWith('--approved-at=')) parsed.approvedAt = arg.slice('--approved-at='.length)
    if (arg.startsWith('--write-secret-file=')) {
      parsed.writeSecretFile = arg.slice('--write-secret-file='.length)
    }
  }

  return parsed
}

export function normalizeStripeLiveWebhookTargetUrl(rawTarget: string) {
  const target = rawTarget.trim()
  if (!target) throw new Error('A target URL is required.')

  const parsed = new URL(target)
  if (parsed.pathname === '/' || parsed.pathname === '') {
    return new URL('/api/stripe/webhook', parsed.origin).toString()
  }
  if (parsed.pathname.endsWith('/api/stripe/webhook')) {
    return parsed.toString()
  }

  return new URL('/api/stripe/webhook', parsed.origin).toString()
}

function getTargetHost(targetUrl: string) {
  return new URL(targetUrl).host
}

function getMissingEvents(endpoint: StripeWebhookEndpointSummary | null) {
  if (!endpoint) return [...STRIPE_LIVE_WEBHOOK_EVENTS]

  const enabledEvents = new Set(endpoint.enabled_events ?? [])
  if (enabledEvents.has('*')) return []
  return STRIPE_LIVE_WEBHOOK_EVENTS.filter(
    (eventName) => !enabledEvents.has(eventName),
  )
}

function mergeEvents(endpoint: StripeWebhookEndpointSummary) {
  const enabledEvents = new Set(endpoint.enabled_events ?? [])
  for (const eventName of STRIPE_LIVE_WEBHOOK_EVENTS) enabledEvents.add(eventName)
  return Array.from(enabledEvents) as Stripe.WebhookEndpointUpdateParams.EnabledEvent[]
}

function buildEndpointMetadata(options: {
  approvedAt: string
  now: Date
}) {
  return {
    platform: 'sparkle_suite',
    launch_path: 'true',
    live_launch: 'true',
    managed_by: 'ensure-stripe-live-webhook-endpoint',
    approved_at: options.approvedAt,
    updated_at: options.now.toISOString(),
  }
}

async function writeSecret(pathname: string, secret: string) {
  await mkdir(path.dirname(pathname), { recursive: true })
  await writeFile(pathname, `${secret}\n`, { encoding: 'utf8', mode: 0o600 })
}

export function validateStripeLiveWebhookOptions(
  options: EnsureStripeLiveWebhookEndpointOptions,
) {
  const errors: string[] = []
  if (options.apply && !options.approvedAt?.trim()) {
    errors.push(
      'STRIPE_LIVE_WEBHOOK_APPROVED_AT or --approved-at is required before creating or updating live webhook endpoints.',
    )
  }
  return errors
}

export async function ensureStripeLiveWebhookEndpoint(
  client: StripeLiveWebhookEndpointClient,
  options: EnsureStripeLiveWebhookEndpointOptions,
): Promise<EnsureStripeLiveWebhookEndpointResult> {
  const errors = validateStripeLiveWebhookOptions(options)
  if (errors.length > 0) throw new Error(errors.join(' '))

  const targetUrl = normalizeStripeLiveWebhookTargetUrl(options.targetUrl)
  const targetHost = getTargetHost(targetUrl)
  const endpoints = await client.list({ limit: 100 })
  const existing = endpoints.data.find((endpoint) => endpoint.url === targetUrl) ?? null
  const missingEvents = getMissingEvents(existing)
  const action: EnsureStripeLiveWebhookEndpointResult['action'] = existing
    ? missingEvents.length > 0
      ? 'update'
      : 'none'
    : 'create'

  let endpoint = existing
  const metadata =
    options.apply && options.approvedAt
      ? buildEndpointMetadata({
          approvedAt: options.approvedAt,
          now: options.now ?? new Date(),
        })
      : null

  if (options.apply && action === 'create' && metadata) {
    endpoint = await client.create({
      url: targetUrl,
      enabled_events: [
        ...STRIPE_LIVE_WEBHOOK_EVENTS,
      ] as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
      description: 'Sparkle Suite production live webhook',
      metadata,
    })
  } else if (options.apply && action === 'update' && existing && metadata) {
    endpoint = await client.update(existing.id, {
      enabled_events: mergeEvents(existing),
      description: 'Sparkle Suite production live webhook',
      metadata,
    })
  }

  const secret = endpoint?.secret?.trim() || null
  let secretWritten = false
  if (options.apply && options.writeSecretFile && secret) {
    await writeSecret(options.writeSecretFile, secret)
    secretWritten = true
  }

  const finalMissingEvents = getMissingEvents(endpoint)

  return {
    ok:
      Boolean(endpoint) &&
      endpoint?.status === 'enabled' &&
      finalMissingEvents.length === 0 &&
      (!options.apply || !options.writeSecretFile || secretWritten),
    mode: options.apply ? 'apply' : 'dry_run',
    action,
    targetUrl,
    targetHost,
    endpointMatched: Boolean(endpoint),
    endpointStatus: endpoint?.status ?? null,
    missingEvents: finalMissingEvents,
    endpointIdPresent: Boolean(endpoint?.id),
    secretAvailable: Boolean(secret),
    secretWritten,
  }
}

function createStripeWebhookEndpointClient(secretKey: string): StripeLiveWebhookEndpointClient {
  const stripe = new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' })
  return {
    list: (input) => stripe.webhookEndpoints.list(input),
    create: (input) => stripe.webhookEndpoints.create(input),
    update: (id, input) => stripe.webhookEndpoints.update(id, input),
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.envFile) {
    config({ path: args.envFile, quiet: true, override: true })
  } else {
    config({ path: '.env.local', quiet: true })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secretKey?.startsWith('sk_live_')) {
    throw new Error('STRIPE_SECRET_KEY must be live mode before managing live webhook endpoints.')
  }

  const targetUrl = args.targetUrl ?? process.env.NEXT_PUBLIC_APP_URL
  if (!targetUrl) {
    throw new Error('Pass --target https://... or set NEXT_PUBLIC_APP_URL.')
  }

  const result = await ensureStripeLiveWebhookEndpoint(
    createStripeWebhookEndpointClient(secretKey),
    {
      targetUrl,
      apply: args.apply,
      approvedAt: args.approvedAt ?? process.env.STRIPE_LIVE_WEBHOOK_APPROVED_AT,
      writeSecretFile: args.writeSecretFile,
    },
  )

  if (args.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(
      `[stripe:live-webhook] mode=${result.mode} action=${result.action} target_host=${result.targetHost} matched=${String(result.endpointMatched)} status=${result.endpointStatus ?? 'missing'} missing_events=${result.missingEvents.length === 0 ? 'none' : result.missingEvents.join(',')} secret_available=${String(result.secretAvailable)} secret_written=${String(result.secretWritten)}`,
    )
  }

  if (!result.ok && args.apply) process.exitCode = 1
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entrypoint === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      `[stripe:live-webhook] ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exitCode = 1
  })
}
