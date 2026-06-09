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
    <main>
      <div className="sparkle-landing-v2">
        <div className="sl2-shell">
          <SparkleSuitePublicHeader />
        </div>
      </div>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
        <LoginClient />
      </Suspense>
      <div className="sparkle-landing-v2">
        <div className="sl2-shell">
          <SparkleSuitePublicFooter />
        </div>
      </div>
    </main>
  )
}
