import TelegramBot from 'node-telegram-bot-api'
import { supabase } from './supabase'

const token = process.env.TELEGRAM_BOT_TOKEN!

let bot: TelegramBot | null = null

export function getBot(): TelegramBot {
  if (!bot) {
    bot = new TelegramBot(token, { polling: false })
  }
  return bot
}

export async function handleTelegramUpdate(body: any) {
  const message = body?.message
  if (!message || !message.text) return

  const content = message.text
  const source = 'telegram'
  const metadata = {
    from_id: message.from?.id,
    from_username: message.from?.username,
    chat_id: message.chat?.id,
    message_id: message.message_id,
    date: message.date,
  }

  const { error } = await supabase
    .from('open_brain')
    .insert({ content, source, metadata })

  if (error) {
    console.error('Open Brain insert error:', error)
  }
}
