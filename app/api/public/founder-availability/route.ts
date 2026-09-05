import { getFounderAvailability } from '@/lib/sparkle-suite/founder-availability-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  const availability = await getFounderAvailability()
  return Response.json(availability, {
    status: availability.status === 'unavailable' ? 503 : 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
