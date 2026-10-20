import { createClient } from '@/lib/supabase/server'

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  
  // Call the database function directly
  const { data, error } = await supabase.rpc('check_is_admin')

  if (error) {
    console.error('isAdmin RPC error:', error.message)
    return false
  }
  
  return !!data
}