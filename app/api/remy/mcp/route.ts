import { controlCenterMcpHandler } from '@/lib/remy-communications/mcp'
import { remyMcpSecurityResponse } from '@/lib/remy-communications/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function handle(request: Request) {
  const securityResponse = remyMcpSecurityResponse(request)
  if (securityResponse) return securityResponse
  return controlCenterMcpHandler.fetch(request)
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}

export async function DELETE(request: Request) {
  return handle(request)
}
