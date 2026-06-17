import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('trade request reveal screenshot migration', () => {
  const sql = readFileSync(
    'supabase/migrations/20260617120003_trade_request_reveal_screenshots.sql',
    'utf8',
  )

  it('adds temporary screenshot metadata to trade requests', () => {
    expect(sql).toContain('ALTER TABLE public.trade_requests')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS reveal_screenshot_path TEXT')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS reveal_screenshot_content_type TEXT')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS reveal_screenshot_size_bytes INTEGER')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS reveal_screenshot_uploaded_at TIMESTAMPTZ')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS reveal_screenshot_expires_at TIMESTAMPTZ')
    expect(sql).toContain('trade_requests_reveal_screenshot_content_type_check')
    expect(sql).toContain('trade_requests_reveal_screenshot_size_bytes_check')
    expect(sql).toContain('8388608')
    expect(sql).toContain('idx_trade_requests_reveal_screenshot_expiry')
  })

  it('provisions a private bucket with rep-scoped storage policies', () => {
    expect(sql).toContain("VALUES ('trade-request-screenshots', 'trade-request-screenshots', false)")
    expect(sql).toContain('trade_request_screenshots_rep_read')
    expect(sql).toContain('trade_request_screenshots_rep_insert')
    expect(sql).toContain("bucket_id = 'trade-request-screenshots'")
    expect(sql).toContain("split_part(name, '/', 1)")
    expect(sql).not.toContain('FOR SELECT TO anon')
    expect(sql).not.toContain('public_read')
  })
})
