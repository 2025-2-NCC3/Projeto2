// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Evita múltiplas instâncias do GoTrueClient no mesmo contexto
// e usa uma storageKey própria (não conflita com outras apps).
const STORAGE_KEY = 'comedoria_supabase_auth'

const getClient = () => {
  if (!globalThis.__supabase) {
    globalThis.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
      },
    })
  }
  return globalThis.__supabase
}

const supabase = getClient()
export default supabase
