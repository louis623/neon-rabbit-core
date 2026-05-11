import { Suspense } from 'react'
import ThumperClient from '../thumper/_client'
import '../thumper/thumper-tokens.css'

export const dynamic = 'force-dynamic'

export default function NicNacPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <ThumperClient />
    </Suspense>
  )
}
