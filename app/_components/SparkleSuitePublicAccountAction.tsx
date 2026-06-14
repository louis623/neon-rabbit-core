'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuthState = 'checking' | 'signed_in' | 'signed_out'
type AccountActionMode = 'public' | 'workspace'

const workspaceHref = '/nic-nac'
const loginHref = '/login?redirect=%2Fnic-nac'

function redirectToWorkspaceUnlessAlreadyThere() {
  const currentPathname = window.location.pathname.replace(/\/+$/, '') || '/'
  if (currentPathname !== workspaceHref) {
    window.location.replace(workspaceHref)
  }
}

export function SparkleSuitePublicAccountAction({
  mode = 'public',
}: {
  mode?: AccountActionMode
}) {
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (mode === 'workspace') {
      setAuthState('signed_in')
      return
    }

    const supabase = createClient()
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session) {
        setAuthState('signed_in')
        redirectToWorkspaceUnlessAlreadyThere()
        return
      }
      setAuthState('signed_out')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthState('signed_in')
        redirectToWorkspaceUnlessAlreadyThere()
        return
      }
      setAuthState('signed_out')
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [mode])

  async function handleLogout() {
    setBusy(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign('/')
  }

  if (mode === 'workspace') {
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
    <a
      className="sl2-header__account-button"
      href={authState === 'signed_in' ? workspaceHref : loginHref}
    >
      {authState === 'signed_in'
        ? 'Sparkle Suite workspace'
        : 'Log in to your Sparkle Suite workspace'}
    </a>
  )
}
