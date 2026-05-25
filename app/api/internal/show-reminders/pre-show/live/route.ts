import { handlePreShowReminderRequest } from '../route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  return handlePreShowReminderRequest(request, 'live')
}
