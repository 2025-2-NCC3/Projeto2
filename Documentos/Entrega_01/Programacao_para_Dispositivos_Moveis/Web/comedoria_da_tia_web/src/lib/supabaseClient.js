// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// variáveis de ambiente obrigatórias
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// checagem preventiva (avisa em dev)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] ⚠️ Variáveis de ambiente não configuradas corretamente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  )
}

// chave de storage única para não conflitar com outros projetos
const STORAGE_KEY = 'comedoria_supabase_auth'

// função singleton (garante apenas 1 instância global)
const getClient = () => {
  // usa window em ambiente browser, globalThis pra SSR
  const globalScope = typeof window !== 'undefined' ? window : globalThis

  if (!globalScope.__supabase) {
    globalScope.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
      },
      global: {
        headers: {
          'x-application-name': 'ComedoriaDaTia-Web',
        },
      },
    })
  }

  return globalScope.__supabase
}

const supabase = getClient()
export { supabase }
export default supabase
