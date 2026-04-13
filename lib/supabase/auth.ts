import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from './admin'

interface AuthenticatedRep {
  repId: string
  rep: {
    id: string
    auth_user_id: string
    email: string
    display_name: string
    stripe_customer_id: string | null
  }
}

export async function getAuthenticatedRep(): Promise<AuthenticatedRep> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll can fail in read-only contexts (GET routes) — safe to ignore
          }
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new AuthError('Not authenticated')
  }

  const admin = createAdminClient()
  const { data: rep, error: repError } = await admin
    .from('reps')
    .select('id, auth_user_id, email, display_name, stripe_customer_id')
    .eq('auth_user_id', user.id)
    .single()

  if (repError || !rep) {
    throw new AuthError('Rep not found for authenticated user')
  }

  return { repId: rep.id, rep }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}
