'use client'

import Link from 'next/link'
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
  const [publicAuthState, setPublicAuthState] = useState<AuthState>('checking')
  const [busy, setBusy] = useState(false)
  const authState = mode === 'workspace' ? 'signed_in' : publicAuthState

  useEffect(() => {
    if (mode === 'workspace') {
      return
    }

    const supabase = createClient()
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session) {
        setPublicAuthState('signed_in')
        redirectToWorkspaceUnlessAlreadyThere()
        return
      }
      setPublicAuthState('signed_out')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setPublicAuthState('signed_in')
        redirectToWorkspaceUnlessAlreadyThere()
        return
      }
      setPublicAuthState('signed_out')
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
    <Link
      className="sl2-header__account-button"
      href={authState === 'signed_in' ? workspaceHref : loginHref}
    >
      {authState === 'signed_in'
        ? 'Sparkle Suite workspace'
        : 'Log in to your Sparkle Suite workspace'}
    </Link>
  )
}
