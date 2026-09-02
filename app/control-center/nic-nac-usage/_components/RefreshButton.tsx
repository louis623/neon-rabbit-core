'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-70"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      type="button"
    >
      <RefreshCw
        aria-hidden="true"
        className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`}
      />
      {isPending ? 'Refreshing…' : 'Refresh'}
    </button>
  )
}
