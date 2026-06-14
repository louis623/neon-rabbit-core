'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuthState = 'checking' | 'signed_in' | 'signed_out'

const workspaceHref = '/nic-nac'
const loginHref = '/login?redirect=%2Fnic-nac'

function redirectToWorkspaceUnlessAlreadyThere() {
  const currentPathname = window.location.pathname.replace(/\/+$/, '') || '/'
  if (currentPathname !== workspaceHref) {
    window.location.replace(workspaceHref)
  }
}

export function SparkleSuitePublicAccountAction() {
  const [authState, setAuthState] = useState<AuthState>('checking')

  useEffect(() => {
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
  }, [])

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
