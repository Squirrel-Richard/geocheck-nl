import { createClient } from '@supabase/supabase-js'

let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    )
  }
  return _supabase
}

// For legacy compat — use getSupabase() at runtime
export const supabase = {
  get from() { return getSupabase().from.bind(getSupabase()) },
  get auth() { return getSupabase().auth },
}

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  )
}
