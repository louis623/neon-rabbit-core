import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";

export default function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SparkleFinderNav />
      <main className="min-h-screen bg-[var(--sparkle-warm-bg)]">
        <div className="mx-auto max-w-[112rem] px-5 py-8 sm:px-8 lg:px-10">{children}</div>
      </main>
    </>
  );
}
