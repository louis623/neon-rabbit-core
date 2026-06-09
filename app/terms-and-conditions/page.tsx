import type { Metadata } from "next";
import { SparkleFinderLegalPage } from "@/components/layout/SparkleFinderLegalPage";
import { sparkleFinderTermsAndConditionsDocument } from "@/lib/sparkle-finder/legal-content";

export const metadata: Metadata = {
  title: sparkleFinderTermsAndConditionsDocument.seoTitle,
  description: sparkleFinderTermsAndConditionsDocument.seoDescription,
  alternates: {
    canonical: "/terms-and-conditions",
  },
  openGraph: {
    title: sparkleFinderTermsAndConditionsDocument.seoTitle,
    description: sparkleFinderTermsAndConditionsDocument.seoDescription,
    url: "/terms-and-conditions",
  },
};

export default function TermsAndConditionsPage() {
  return <SparkleFinderLegalPage document={sparkleFinderTermsAndConditionsDocument} />;
}
