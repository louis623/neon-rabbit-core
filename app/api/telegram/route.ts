import { NextRequest, NextResponse } from 'next/server'
import { handleTelegramUpdate } from '@/lib/telegram-bot'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await handleTelegramUpdate(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
