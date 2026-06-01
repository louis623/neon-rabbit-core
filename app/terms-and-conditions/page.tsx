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

function readReturnTo(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw?.trim()) return null

  try {
    const decoded = decodeURIComponent(raw.trim())
    if (!decoded.startsWith('/')) return null
    if (decoded.startsWith('//')) return null
    return decoded
  } catch {
    return null
  }
}

export default async function TermsAndConditionsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    returnTo?: string | string[]
  }>
}) {
  const query = searchParams ? await searchParams : {}
  const returnTo = readReturnTo(query.returnTo)

  return (
    <SparkleLegalPage
      backHref={returnTo ?? undefined}
      backLabel={returnTo ? 'Back to checkout' : undefined}
      document={termsAndConditionsDocument}
    />
  )
}
