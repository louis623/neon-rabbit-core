import type { Metadata } from 'next'

import { SparkleLegalPage } from '@/app/_components/SparkleLegalPage'
import { termsAndConditionsDocument } from '@/lib/prelaunch/legal-content'

export const metadata: Metadata = {
  title: termsAndConditionsDocument.seoTitle,
  description: termsAndConditionsDocument.seoDescription,
  alternates: {
    canonical: '/terms-and-conditions',
  },
  openGraph: {
    title: termsAndConditionsDocument.seoTitle,
    description: termsAndConditionsDocument.seoDescription,
    url: '/terms-and-conditions',
    type: 'article',
  },
}

export default function TermsAndConditionsPage() {
  return <SparkleLegalPage document={termsAndConditionsDocument} />
}
