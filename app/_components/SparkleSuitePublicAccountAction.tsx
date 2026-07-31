'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuthState = 'checking' | 'signed_in' | 'signed_out'

export function SparkleSuitePublicAccountAction() {
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
    window.location.assign('/')
  }

  if (authState === 'checking') {
    return <span>Sparkle Suite account</span>
  }

  if (authState === 'signed_in') {
    return (
      <button
        className="sl2-header__account-button"
        disabled={busy}
        onClick={() => void handleLogout()}
        type="button"
      >
        {busy ? 'Logging out...' : 'Log out'}
      </button>
    )
  }

  return (
    <>
      <span>Already have Sparkle Suite?</span>
      <a href="/login">Sign in here.</a>
    </>
  )
}
