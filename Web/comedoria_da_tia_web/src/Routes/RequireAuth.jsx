// src/routes/RequireAuth.jsx
import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import supabase from '../lib/supabaseClient'

export default function RequireAuth() {
  const [checking, setChecking] = useState(true)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    let mounted = true

    // checa sessão atual
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setOk(!!data.session)
      setChecking(false)
    })

    // escuta mudanças de auth
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setOk(!!session)
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  if (checking) return null // ou um spinner/skeleton aqui

  return ok ? <Outlet /> : <Navigate to="/login" replace />
}
