import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Fetches the currently authenticated user.
 * Returns null if no user is signed in.
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Requires an authenticated user.
 * Redirects to /login if the user is not authenticated.
 */
export async function requireUser() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
}
