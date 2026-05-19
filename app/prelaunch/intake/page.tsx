import type { Metadata } from 'next'

import { PrelaunchFooter } from '../_components/PrelaunchFooter'
import { PrelaunchIntakeForm } from '../_components/PrelaunchIntakeForm'

export const metadata: Metadata = {
  title: {
    absolute: 'Sparkle Suite | Client Intake',
  },
  description:
    'Submit the Sparkle Suite client intake form after an operator confirms fit and next steps.',
  alternates: {
    canonical: '/prelaunch/intake',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function PrelaunchIntakePage() {
  return (
    <main className="prelaunch-shell">
      <PrelaunchIntakeForm />
      <PrelaunchFooter ctaHref="/prelaunch#waitlist" ctaLabel="Back to Waitlist" />
    </main>
  )
}
