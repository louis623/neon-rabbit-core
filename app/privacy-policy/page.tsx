import type { Metadata } from 'next'

import { SparkleLegalPage } from '@/app/_components/SparkleLegalPage'
import { privacyPolicyDocument } from '@/lib/prelaunch/legal-content'

export const metadata: Metadata = {
  title: privacyPolicyDocument.seoTitle,
  description: privacyPolicyDocument.seoDescription,
  alternates: {
    canonical: '/privacy-policy',
  },
  openGraph: {
    title: privacyPolicyDocument.seoTitle,
    description: privacyPolicyDocument.seoDescription,
    url: '/privacy-policy',
    type: 'article',
  },
}

export default function PrivacyPolicyPage() {
  return <SparkleLegalPage document={privacyPolicyDocument} />
}
