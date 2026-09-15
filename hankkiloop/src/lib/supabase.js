import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const publicKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim()

export const isSupabaseConfigured = Boolean(url && /^https?:\/\//.test(url) && publicKey && !publicKey.startsWith('sb_secret_'))

export const supabase = isSupabaseConfigured ? createClient(url, publicKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
}) : null
