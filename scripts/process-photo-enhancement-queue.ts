import { createAdminClient } from '@/lib/supabase/admin'
import { processReadyPhotoEnhancementQueue } from '@/lib/services/photo-enhancement-queue'

async function main() {
  const limit = Number.parseInt(process.env.PHOTO_QUEUE_LIMIT ?? '25', 10)
  const result = await processReadyPhotoEnhancementQueue(createAdminClient(), {
    limit: Number.isFinite(limit) && limit > 0 ? limit : 25,
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error('[photo-enhancement-queue] failed', error)
  process.exitCode = 1
})
