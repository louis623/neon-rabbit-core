import { Suspense } from 'react'
import type { Metadata } from 'next'
import {
  SparkleSuitePublicFooter,
  SparkleSuitePublicHeader,
} from '@/app/_components/sparkle-suite-public-chrome'
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
    <main className="sparkle-landing-v2">
      <div className="sl2-shell">
        <SparkleSuitePublicHeader />
        <section className="sl2-login" aria-label="Sparkle Suite sign in">
          <Suspense fallback={<div className="sl2-login__loading">Loading...</div>}>
            <LoginClient />
          </Suspense>
        </section>
        <SparkleSuitePublicFooter />
      </div>
    </main>
  )
}
