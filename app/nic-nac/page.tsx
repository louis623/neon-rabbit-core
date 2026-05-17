import { Suspense } from 'react'
import NicNacClient from './_client'
import './nic-nac-tokens.css'

export const dynamic = 'force-dynamic'

export default function NicNacPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <NicNacClient />
    </Suspense>
  )
}
