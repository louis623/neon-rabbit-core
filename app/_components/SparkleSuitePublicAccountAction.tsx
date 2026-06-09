'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AuthState = 'checking' | 'signed_in' | 'signed_out'

export function SparkleSuitePublicAccountAction() {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setAuthState(data.session ? 'signed_in' : 'signed_out')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session ? 'signed_in' : 'signed_out')
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    setBusy(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    setAuthState('signed_out')
    router.replace('/')
    router.refresh()
  }

  if (authState === 'checking') {
    return <span>Sparkle Suite account</span>
  }

  if (authState === 'signed_in') {
    return (
      <>
        <span>Signed into Sparkle Suite?</span>
        <button
          className="sl2-header__account-button"
          disabled={busy}
          onClick={() => void handleLogout()}
          type="button"
        >
          {busy ? 'Logging out...' : 'Log out'}
        </button>
      </>
    )
  }

  return (
    <>
      <span>Already have Sparkle Suite?</span>
      <a href="/login">Sign in here.</a>
    </>
  )
}
