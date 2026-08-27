import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('Remy Communications MCP security', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.REMY_MCP_BEARER_TOKEN
    delete process.env.REMY_MCP_ALLOWED_ORIGINS
  })

  it('fails closed until a dedicated service token is configured', async () => {
    const { remyMcpSecurityResponse } = await import('@/lib/remy-communications/security')
    const response = remyMcpSecurityResponse(new Request('https://www.yoursparklesuite.com/api/remy/mcp'))
    expect(response?.status).toBe(503)
  })

  it('requires the dedicated token and permits an absent server-to-server Origin header', async () => {
    process.env.REMY_MCP_BEARER_TOKEN = 'remy-test-token'
    const { remyMcpSecurityResponse } = await import('@/lib/remy-communications/security')

    expect(remyMcpSecurityResponse(new Request('https://www.yoursparklesuite.com/api/remy/mcp'))?.status).toBe(401)
    expect(remyMcpSecurityResponse(new Request('https://www.yoursparklesuite.com/api/remy/mcp', {
      headers: { authorization: 'Bearer remy-test-token' },
    }))).toBeNull()
  })

  it('rejects browser origins outside the explicit Grok allowlist', async () => {
    process.env.REMY_MCP_BEARER_TOKEN = 'remy-test-token'
    const { remyMcpSecurityResponse } = await import('@/lib/remy-communications/security')
    const response = remyMcpSecurityResponse(new Request('https://www.yoursparklesuite.com/api/remy/mcp', {
      headers: { authorization: 'Bearer remy-test-token', origin: 'https://example.test' },
    }))
    expect(response?.status).toBe(403)
  })
})
