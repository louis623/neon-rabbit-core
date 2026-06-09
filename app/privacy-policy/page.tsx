import type { Metadata } from "next";
import { SparkleFinderLegalPage } from "@/components/layout/SparkleFinderLegalPage";
import { sparkleFinderPrivacyPolicyDocument } from "@/lib/sparkle-finder/legal-content";

export const metadata: Metadata = {
  title: sparkleFinderPrivacyPolicyDocument.seoTitle,
  description: sparkleFinderPrivacyPolicyDocument.seoDescription,
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: sparkleFinderPrivacyPolicyDocument.seoTitle,
    description: sparkleFinderPrivacyPolicyDocument.seoDescription,
    url: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return <SparkleFinderLegalPage document={sparkleFinderPrivacyPolicyDocument} />;
}
