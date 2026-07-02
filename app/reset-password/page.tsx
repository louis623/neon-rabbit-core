import { Suspense } from 'react'
import type { Metadata } from 'next'
import {
  SparkleSuitePublicFooter,
  SparkleSuitePublicHeader,
} from '@/app/_components/sparkle-suite-public-chrome'
import ResetPasswordClient from './_client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reset Sparkle Suite Password',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResetPasswordPage() {
  return (
    <main className="sparkle-landing-v2">
      <div className="sl2-shell">
        <SparkleSuitePublicHeader />
        <section className="sl2-login" aria-label="Sparkle Suite password reset">
          <Suspense fallback={<div className="sl2-login__loading">Loading...</div>}>
            <ResetPasswordClient />
          </Suspense>
        </section>
        <SparkleSuitePublicFooter />
      </div>
    </main>
  )
}
