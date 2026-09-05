'use client'

import Image from 'next/image'
import Link from 'next/link'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, Check, Pause, Play, Sparkles } from 'lucide-react'
import type { FounderAvailability } from '@/lib/sparkle-suite/founder-availability'
import styles from './landing-experience.module.css'

const unavailable: FounderAvailability = { status: 'unavailable', remaining: null, checkedAt: null }
const AvailabilityContext = createContext<FounderAvailability>(unavailable)

export function FounderAvailabilityProvider({ children, initialAvailability = unavailable }: {
  children: ReactNode
  initialAvailability?: FounderAvailability
}) {
  const [availability, setAvailability] = useState(initialAvailability)
  useEffect(() => {
    let active = true
    let pending: AbortController | null = null
    async function refresh() {
      if (document.hidden) return
      pending?.abort()
      const controller = new AbortController()
      pending = controller
      const timeout = window.setTimeout(() => controller.abort(), 7000)
      try {
        const response = await fetch('/api/public/founder-availability', { cache: 'no-store', signal: controller.signal })
        const data = await response.json() as FounderAvailability
        const valid = response.ok && ((data.status === 'available' && Number.isInteger(data.remaining) && data.remaining! > 0 && data.remaining! <= 20) || (data.status === 'full' && data.remaining === 0))
        if (active && pending === controller) setAvailability(valid ? data : unavailable)
      } catch {
        if (active && pending === controller) setAvailability(unavailable)
      } finally { window.clearTimeout(timeout) }
    }
    void refresh()
    const interval = window.setInterval(() => void refresh(), 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => { active = false; pending?.abort(); window.clearInterval(interval); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  return <AvailabilityContext.Provider value={availability}>{children}</AvailabilityContext.Provider>
}

export function FounderSpotLabel({ large = false }: { large?: boolean }) {
  const availability = useContext(AvailabilityContext)
  const label = availability.status === 'available'
    ? `${availability.remaining} founder ${availability.remaining === 1 ? 'spot' : 'spots'} remaining.`
    : availability.status === 'full' ? 'A new chapter starts here.' : 'Now building Sparkle Suite sites.'
  return <span className={large ? styles.spotLarge : styles.spotLabel} aria-live="polite">{label}</span>
}

export function FounderStrip() {
  const availability = useContext(AvailabilityContext)
  return <div className={styles.founderStrip}>
    <Sparkles size={21} aria-hidden="true" />
    <FounderSpotLabel />
    <span>{availability.status === 'available' ? 'Get in at the start. Secure your founding rate before the spots are gone.' : 'Join the build queue. Let’s talk about your next steps.'}</span>
    <a href="#pricing" className={styles.textLink}>See the offer <ArrowRight size={16} aria-hidden="true" /></a>
  </div>
}

export function FounderOffer({ compact = false }: { compact?: boolean }) {
  const availability = useContext(AvailabilityContext)
  const founder = availability.status === 'available'
  return <article className={`${styles.offer} ${compact ? styles.compactOffer : ''}`} aria-label={founder ? 'Sparkle Suite founding rep pricing' : 'Sparkle Suite standard pricing'}>
    <span className={styles.offerLabel}>{founder ? 'Founding rep rate' : 'Sparkle Suite Standard'}</span>
    <p className={styles.price}><strong>{founder ? '$49.99' : '$74.99'}</strong><span>/ month</span></p>
    <p className={styles.priceTerm}>{founder ? '$74.99/month after your first 12 paid service months.' : 'Monthly subscription from checkout.'}</p>
    <dl className={styles.priceDetails}>
      <div><dt>One-time setup</dt><dd>$49.99</dd></div>
      <div><dt>First checkout</dt><dd>{founder ? '$99.98' : '$124.98'} <span>+ applicable tax</span></dd></div>
    </dl>
    <p className={styles.finePrint}>Setup is non-refundable. Your subscription starts at checkout.</p>
    {availability.status === 'unavailable' && <p className={styles.finePrint}>Founder availability is temporarily unconfirmed. Any eligible founding rate will be confirmed at checkout.</p>}
    {availability.status === 'full' && <p className={styles.finePrint}>All founder spots have been allocated. You can still join at the standard rate.</p>}
    {!compact && <Link className={styles.primaryButton} href="/prelaunch#waitlist">Join the build queue <ArrowRight size={18} aria-hidden="true" /></Link>}
    <p className={styles.offerDisclaimer}>Joining the queue does not reserve a founder rate. Eligibility is confirmed at checkout.</p>
  </article>
}

const looks = [
  { id: 'blush', name: 'Blush', description: 'Soft, warm, and unmistakably yours.', src: '/sparkle-suite/landing/site-blush.webp', width: 1265, height: 988 },
  { id: 'violet', name: 'Violet', description: 'A little bold. A lot of personality.', src: '/sparkle-suite/landing/site-violet.webp', width: 1265, height: 988 },
  { id: 'night', name: 'Midnight', description: 'A rich, dramatic stage for your sparkle.', src: '/sparkle-suite/landing/site-night.webp', width: 1265, height: 988 },
] as const

export function SiteStyleShowcase() {
  const [selected, setSelected] = useState(0)
  const look = looks[selected]
  return <div className={styles.styleShowcase}>
    <div className={styles.styleChoices} role="group" aria-label="Choose a customer-site style">
      {looks.map((item, index) => <button key={item.id} type="button" aria-pressed={selected === index} aria-controls="site-style-preview" onClick={() => setSelected(index)}><span className={styles.swatch} data-look={item.id} aria-hidden="true" />{item.name}</button>)}
    </div>
    <figure id="site-style-preview" className={styles.styleFigure}>
      <div className={styles.browserBar} aria-hidden="true"><span /><span /><span /><em>Your customer site</em></div>
      <div className={styles.styleMedia} key={look.id}><Image src={look.src} alt={`${look.name} Sparkle Suite customer-site example`} width={look.width} height={look.height} sizes="(max-width: 700px) 94vw, 1000px" /></div>
      <figcaption aria-live="polite">{look.description} <span>Choose a look. Keep the tools your customers love.</span></figcaption>
    </figure>
  </div>
}

const tools = [
  { label: 'Live queue', title: 'A line customers can follow.', body: 'Make it easy to see who is up now and who is coming next, without stopping the show to repeat the list.', src: '/sparkle-suite/landing/live-queue.webp', alt: 'Sample Live queue showing the current unboxing and next three customers', width: 700, height: 550 },
  { label: 'Dance Floor', title: 'Trade pieces, not endless messages.', body: 'Give customers a clear place to browse available pieces and send a trade request. Keep the details together on your side.', src: '/sparkle-suite/landing/trade-board-desktop-proof.webp', alt: 'Real Sparkle Suite customer Dance Floor with jewelry listings', width: 1283, height: 942 },
  { label: 'Live calendar', title: 'Your next live, easy to find.', body: 'Put upcoming shows, featured collections, and show details where customers can find them before you go live.', src: '/sparkle-suite/landing/live-calendar.webp', alt: 'Sample show calendar with dates, featured collections, watch links and add-to-calendar controls', width: 925, height: 440 },
  { label: 'Nic-Nac', title: 'A helping hand behind the scenes.', body: 'Get built-in support for your site, show calendar, and Dance Floor while you stay focused on your customers.', src: '/sparkle-suite/landing/nic-nac-workspace-proof.webp', alt: 'Real Nic-Nac workspace helping prepare a jewelry listing', width: 1440, height: 701 },
] as const

export function ShowToolsTour() {
  const [selected, setSelected] = useState(0)
  const [playing, setPlaying] = useState(false)
  const tool = tools[selected]
  useEffect(() => {
    if (!playing) return
    const timeout = window.setTimeout(() => {
      if (selected === tools.length - 1) setPlaying(false)
      else setSelected(selected + 1)
    }, 5000)
    return () => window.clearTimeout(timeout)
  }, [playing, selected])
  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) setPlaying(false) }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden)
  }, [])
  return <div className={styles.toolsLayout}>
    <div className={styles.toolsCopy}>
      <h2>Less scramble.<br /><em>More showtime.</em></h2>
      <p>Help customers find the next live, follow the line, and browse the Dance Floor. You keep the show moving.</p>
      <div className={styles.toolChoices} role="group" aria-label="Explore Sparkle Suite show tools">
        {tools.map((item, index) => <button type="button" key={item.label} aria-pressed={selected === index} aria-controls="show-tool-preview" onClick={() => { setPlaying(false); setSelected(index) }}>{item.label}</button>)}
      </div>
      <div className={styles.toolDescription} aria-live={playing ? 'off' : 'polite'}><h3>{tool.title}</h3><p>{tool.body}</p></div>
      <button className={styles.tourButton} type="button" onClick={() => { if (!playing) setSelected(0); setPlaying(!playing) }}>{playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}{playing ? 'Pause tour' : 'Play the quick tour'}</button>
      <span className={styles.tourNote}>Product previews. No live customer activity.</span>
    </div>
    <figure id="show-tool-preview" className={styles.toolFigure}>
      <div className={styles.toolImage} key={selected}><Image src={tool.src} alt={tool.alt} width={tool.width} height={tool.height} sizes="(max-width: 900px) 92vw, 720px" /></div>
      <figcaption>{tool.label} <span aria-hidden="true">·</span> Inside Sparkle Suite</figcaption>
      <div className={styles.tourProgress} aria-label={`Preview ${selected + 1} of ${tools.length}`}>{tools.map((item, i) => <span key={item.label} data-current={selected === i} />)}</div>
    </figure>
  </div>
}

export function IncludedFeatures() {
  return <ul className={styles.included} aria-label="Included in Sparkle Suite">{['Your customer site', 'Live queue & Dance Floor', 'Live event calendar', 'Nic-Nac support'].map(item => <li key={item}><Check size={19} aria-hidden="true" />{item}</li>)}</ul>
}
