import { Suspense } from 'react'
import type { Metadata } from 'next'
import LoginClient from './_client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Login',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <LoginClient />
    </Suspense>
  )
}
