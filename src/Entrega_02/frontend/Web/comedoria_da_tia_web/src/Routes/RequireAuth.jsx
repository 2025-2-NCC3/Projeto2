// src/routes/RequireAuth.jsx
import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import supabase from '../lib/supabaseClient'

export default function RequireAuth() {
  const [checking, setChecking] = useState(true)
  const [ok, setOk] = useState(false)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    let mounted = true

    // checa sessão atual
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      
      const hasSession = !!data.session
      setOk(hasSession)
      
      if (hasSession && data.session.user) {
        // Pega a role do user_metadata
        const role = data.session.user.user_metadata?.role || 'user'
        setUserRole(role)
      }
      
      setChecking(false)
    })

    // escuta mudanças de auth
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      const hasSession = !!session
      setOk(hasSession)
      
      if (hasSession && session.user) {
        const role = session.user.user_metadata?.role || 'user'
        setUserRole(role)
      } else {
        setUserRole(null)
      }
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  if (checking) return null // ou um spinner/skeleton aqui

  return ok ? <Outlet context={{ userRole }} /> : <Navigate to="/login" replace />
}