import { notFound } from 'next/navigation'
import { SparkleSuitePublicNicNac } from '@/app/_components/sparkle-suite-public-nic-nac'

export const dynamic = 'force-dynamic'

export default function PublicNicNacReviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return (
    <main style={{ padding: '2rem', maxWidth: '48rem', margin: 'auto' }}>
      <h1>Public Nic-Nac — local review</h1>
      <p>Use Reviewer Example and reviewer@example.test. Choose failure first, then saved receipt.
        Review controls simulate persistence only. Reload to reset. This page is unavailable in production.</p>
      <SparkleSuitePublicNicNac reviewMode />
    </main>
  )
}
