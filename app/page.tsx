import type { Metadata } from "next";

import { AmethystHomepage } from "@/components/amethyst/amethyst-homepage";
import { defaultAmethystSiteContent } from "@/lib/amethyst/site-content";

export const metadata: Metadata = {
  title: "Amethyst Homepage Template",
  description:
    "Customer-facing Sparkle Suite homepage template with Amethyst theming, shared header/footer, and placeholder rep data.",
};

export default function Home() {
  return <AmethystHomepage content={defaultAmethystSiteContent} />;
}
