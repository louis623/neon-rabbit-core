import Link from 'next/link'

export function ControlCenterProductSwitcher({ active }: { active: 'suite' | 'finder' }) {
  return (
    <nav aria-label="Control Center product" className="grid w-full max-w-xl grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <Link
        aria-current={active === 'suite' ? 'page' : undefined}
        className={`rounded-lg px-4 py-3 text-center text-sm font-bold transition ${active === 'suite' ? 'bg-violet-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
        href="/control-center?product=suite"
      >
        Sparkle Suite
      </Link>
      <Link
        aria-current={active === 'finder' ? 'page' : undefined}
        className={`rounded-lg px-4 py-3 text-center text-sm font-bold transition ${active === 'finder' ? 'bg-violet-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
        href="/control-center?product=finder"
      >
        Sparkle Finder
      </Link>
    </nav>
  )
}
