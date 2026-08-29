import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

import * as calendarSummary from '@/app/api/nic-nac/calendar-summary/route'
import * as fulfillmentQueue from '@/app/api/nic-nac/fulfillment-queue/route'
import * as jewelryLibrary from '@/app/api/nic-nac/jewelry-library/route'
import * as joinTeamRoster from '@/app/api/nic-nac/join-team-roster/route'
import * as me from '@/app/api/nic-nac/me/route'
import * as resources from '@/app/api/nic-nac/resources/route'
import * as resourceLibrary from '@/app/api/nic-nac/resource-library/route'
import * as siteRecipes from '@/app/api/nic-nac/site-recipes/route'
import * as siteRecipeDraft from '@/app/api/nic-nac/site-recipes/draft/route'
import * as siteRecipeImage from '@/app/api/nic-nac/site-recipes/image/route'
import * as siteSettings from '@/app/api/nic-nac/site-settings/route'
import * as siteSettingsMedia from '@/app/api/nic-nac/site-settings/media/route'
import * as teamParticipants from '@/app/api/nic-nac/team-onboarding/participants/route'
import * as teamParticipant from '@/app/api/nic-nac/team-onboarding/participants/[participantId]/route'
import * as tradeBoard from '@/app/api/nic-nac/trade-board/route'
import * as tradeHistory from '@/app/api/nic-nac/trade-history/route'
import * as tradeRequests from '@/app/api/nic-nac/trade-requests/route'
import * as tradeRevealScreenshot from '@/app/api/nic-nac/trade-requests/[requestId]/reveal-screenshot/route'
import * as tradeSwapCleanup from '@/app/api/nic-nac/trade-swap-cleanup/route'
import * as setupState from '@/app/api/self-serve/setup-state/route'
import {
  appendOperatorSupportAuditEvent,
  OperatorSupportAuditUnavailableError,
} from '@/lib/operator-support/audit'
import { loadVerifiedOperatorSupportContext } from '@/lib/operator-support/http'
import { normalizeOperatorSupportMutationRequestId } from '@/lib/operator-support/mutation-guard'
import { runWithOperatorSupportRequestContext } from '@/lib/operator-support/request-context'
import {
  getOperatorSupportRouteClassification,
  isOperatorSupportGatewayClassificationAllowed,
  type OperatorSupportHttpMethod,
} from '@/lib/operator-support/route-classification'
import { OperatorSupportError } from '@/lib/operator-support/session-service'
import type {
  OperatorSupportWorkspaceArea,
  SupportCapability,
} from '@/lib/operator-support/types'

type RouteContext = { params: Promise<Record<string, string>> }
type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>
type RouteModule = Partial<Record<OperatorSupportHttpMethod, RouteHandler>>

const STATIC_ROUTE_MODULES = new Map<string, RouteModule>([
  ['/api/self-serve/setup-state', setupState as unknown as RouteModule],
  ['/api/nic-nac/me', me as unknown as RouteModule],
  ['/api/nic-nac/calendar-summary', calendarSummary as unknown as RouteModule],
  ['/api/nic-nac/fulfillment-queue', fulfillmentQueue as unknown as RouteModule],
  ['/api/nic-nac/jewelry-library', jewelryLibrary as unknown as RouteModule],
  ['/api/nic-nac/join-team-roster', joinTeamRoster as unknown as RouteModule],
  ['/api/nic-nac/resources', resources as unknown as RouteModule],
  ['/api/nic-nac/resource-library', resourceLibrary as unknown as RouteModule],
  ['/api/nic-nac/site-recipes', siteRecipes as unknown as RouteModule],
  ['/api/nic-nac/site-recipes/draft', siteRecipeDraft as unknown as RouteModule],
  ['/api/nic-nac/site-recipes/image', siteRecipeImage as unknown as RouteModule],
  ['/api/nic-nac/site-settings', siteSettings as unknown as RouteModule],
  ['/api/nic-nac/site-settings/media', siteSettingsMedia as unknown as RouteModule],
  ['/api/nic-nac/team-onboarding/participants', teamParticipants as unknown as RouteModule],
  ['/api/nic-nac/trade-board', tradeBoard as unknown as RouteModule],
  ['/api/nic-nac/trade-history', tradeHistory as unknown as RouteModule],
  ['/api/nic-nac/trade-requests', tradeRequests as unknown as RouteModule],
  ['/api/nic-nac/trade-swap-cleanup', tradeSwapCleanup as unknown as RouteModule],
])

function resolveRoute(path: string): {
  module: RouteModule
  pattern: string
  params: Record<string, string>
} | null {
  const direct = STATIC_ROUTE_MODULES.get(path)
  if (direct) return { module: direct, pattern: path, params: {} }

  let match = path.match(/^\/api\/nic-nac\/team-onboarding\/participants\/([^/]+)$/)
  if (match) {
    return {
      module: teamParticipant as unknown as RouteModule,
      pattern: '/api/nic-nac/team-onboarding/participants/[participantId]',
      params: { participantId: decodeURIComponent(match[1]!) },
    }
  }
  match = path.match(/^\/api\/nic-nac\/trade-requests\/([^/]+)\/reveal-screenshot$/)
  if (match) {
    return {
      module: tradeRevealScreenshot as unknown as RouteModule,
      pattern: '/api/nic-nac/trade-requests/[requestId]/reveal-screenshot',
      params: { requestId: decodeURIComponent(match[1]!) },
    }
  }
  return null
}

function chooseCapability(
  capabilities: readonly SupportCapability[] | undefined,
  method: OperatorSupportHttpMethod,
) {
  if (!capabilities?.length) return 'workspace.view' as const
  const suffix = method === 'GET' || method === 'HEAD' ? '.view' : '.manage'
  return capabilities.find((item) => item.endsWith(suffix)) ?? capabilities[0]!
}

function workspaceArea(capability: SupportCapability): OperatorSupportWorkspaceArea {
  if (capability.startsWith('site.')) return 'site'
  if (capability.startsWith('inventory.')) return 'inventory'
  if (capability.startsWith('calendar.')) return 'calendar'
  if (capability.startsWith('customers.')) return 'customers'
  if (capability.startsWith('team.')) return 'team'
  if (capability.startsWith('messages.')) return 'messages'
  if (capability.startsWith('nic_nac.')) return 'nic_nac'
  if (capability.startsWith('live_queue.')) return 'live_queue'
  return 'workspace'
}

async function cloneForOriginalRoute(request: Request, path: string) {
  const source = new URL(request.url)
  const url = new URL(path, source.origin)
  source.searchParams.forEach((value, key) => {
    if (key !== 'path') url.searchParams.append(key, value)
  })
  const method = request.method.toUpperCase()
  return new Request(url, {
    method,
    headers: request.headers,
    body:
      method === 'GET' || method === 'HEAD'
        ? undefined
        : await request.arrayBuffer(),
  })
}

async function handleGateway(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params
  const url = new URL(request.url)
  const path = url.searchParams.get('path')?.trim() ?? ''
  const method = request.method.toUpperCase() as OperatorSupportHttpMethod
  const resolved = resolveRoute(path)
  const classification = resolved
    ? getOperatorSupportRouteClassification(resolved.pattern)
    : getOperatorSupportRouteClassification(path)

  try {
    if (
      !classification ||
      !isOperatorSupportGatewayClassificationAllowed(
        classification.classification,
      )
    ) {
      const blockedMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method)
      const context = await loadVerifiedOperatorSupportContext(sessionId, {
        capability: 'workspace.view',
        mutation: blockedMutation,
        request,
      })
      await appendOperatorSupportAuditEvent(context.supabase, {
        supportSessionId: sessionId,
        operatorRepId: context.session.operatorRepId,
        targetRepId: context.session.targetRepId,
        eventType: 'blocked_action_attempted',
        workspaceArea: 'security',
        actionName: path || 'unknown_workspace_route',
        result: 'denied',
        errorCode: 'SUPPORT_ACTION_BLOCKED',
        requestId: request.headers.get('x-sparkle-support-request-id'),
      })
      return NextResponse.json(
        { error: 'That action is unavailable during support access.', code: 'SUPPORT_ACTION_BLOCKED' },
        { status: 403 },
      )
    }
    const allowedMethods = classification.methods as readonly OperatorSupportHttpMethod[]
    if (!resolved || !allowedMethods.includes(method)) {
      return NextResponse.json(
        { error: 'That support operation is not available.', code: 'SUPPORT_ACTION_BLOCKED' },
        { status: 403 },
      )
    }

    const handler = resolved.module[method]
    if (!handler) {
      return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
    }
    const classifiedCapabilities =
      'capabilities' in classification ? classification.capabilities : undefined
    const capability = chooseCapability(classifiedCapabilities, method)
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(method)
    const context = await loadVerifiedOperatorSupportContext(sessionId, {
      capability,
      mutation,
      request,
    })
    const requestId = mutation
      ? normalizeOperatorSupportMutationRequestId(
          request.headers.get('x-sparkle-support-request-id'),
        )
      : request.headers.get('x-sparkle-support-request-id')?.trim() || null
    if (mutation && !requestId) {
      return NextResponse.json(
        { error: 'A valid support request ID is required.', code: 'SUPPORT_REQUEST_ID_INVALID' },
        { status: 400 },
      )
    }
    const auditBase = {
      supportSessionId: sessionId,
      operatorRepId: context.session.operatorRepId,
      targetRepId: context.session.targetRepId,
      workspaceArea: workspaceArea(capability),
      capability,
      actionName: `${method.toLowerCase()} ${resolved.pattern}`,
      requestId,
    } as const

    if (mutation) {
      const { data: priorAttempt, error: priorAttemptError } = await context.supabase
        .from('operator_support_audit_events')
        .select('id')
        .eq('support_session_id', sessionId)
        .eq('event_type', 'mutation_attempted')
        .eq('idempotency_key', requestId!)
        .limit(1)
      if (priorAttemptError) throw new OperatorSupportAuditUnavailableError(undefined, { cause: priorAttemptError })
      if ((priorAttempt ?? []).length > 0) {
        return NextResponse.json(
          {
            error: 'This support mutation was already attempted. Refresh the Workspace to verify its result before trying a new action.',
            code: 'SUPPORT_REQUEST_ALREADY_ATTEMPTED',
          },
          { status: 409 },
        )
      }
      await appendOperatorSupportAuditEvent(context.supabase, {
        ...auditBase,
        eventType: 'mutation_attempted',
        result: 'attempted',
        resourceType: 'support_request',
        resourceId: randomUUID(),
        idempotencyKey: requestId,
      })
    } else {
      await appendOperatorSupportAuditEvent(context.supabase, {
        ...auditBase,
        eventType: 'workspace_area_viewed',
        result: 'succeeded',
        idempotencyKey: `view:${sessionId}:${workspaceArea(capability)}`,
        actionName: `view_${workspaceArea(capability)}`,
        requestId: null,
      })
    }

    const originalRequest = await cloneForOriginalRoute(request, path)
    let response: Response
    try {
      response = await runWithOperatorSupportRequestContext(context, () =>
        handler(originalRequest, { params: Promise.resolve(resolved.params) }),
      )
    } catch (error) {
      if (mutation) {
        await appendOperatorSupportAuditEvent(context.supabase, {
          ...auditBase,
          eventType: 'mutation_failed',
          result: 'failed',
          errorCode: 'DOMAIN_MUTATION_FAILED',
          idempotencyKey: requestId,
        })
      }
      throw error
    }

    if (mutation) {
      if (!response.ok) {
        await appendOperatorSupportAuditEvent(context.supabase, {
          ...auditBase,
          eventType: 'mutation_failed',
          result: 'failed',
          errorCode: `HTTP_${response.status}`,
          idempotencyKey: requestId,
        })
      } else {
        try {
          await appendOperatorSupportAuditEvent(context.supabase, {
            ...auditBase,
            eventType: 'mutation_succeeded',
            result: 'succeeded',
            idempotencyKey: requestId,
          })
        } catch (error) {
          // The durable attempted event prevents a blind retry. We cannot
          // truthfully acknowledge success until its outcome audit is stored.
          console.error('[operator-support/gateway] mutation outcome audit failed', error)
          return NextResponse.json(
            {
              error: 'The change may have completed, but its final audit result could not be stored. Refresh to verify the account; do not repeat the action.',
              code: 'SUPPORT_AUDIT_OUTCOME_UNCONFIRMED',
            },
            { status: 409 },
          )
        }
      }
    }
    return response
  } catch (error) {
    if (error instanceof OperatorSupportError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      )
    }
    console.error('[operator-support/gateway]', error)
    return NextResponse.json(
      { error: 'The support request could not be completed safely.' },
      { status: 500 },
    )
  }
}

export const GET = handleGateway
export const POST = handleGateway
export const PUT = handleGateway
export const PATCH = handleGateway
export const DELETE = handleGateway
