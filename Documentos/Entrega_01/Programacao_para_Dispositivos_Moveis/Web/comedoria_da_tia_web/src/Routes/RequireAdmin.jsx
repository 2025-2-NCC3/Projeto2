// src/routes/RequireAdmin.jsx (com página de acesso negado)
import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import supabase from '../lib/supabaseClient'

export default function RequireAdmin() {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      
      const hasSession = !!data.session
      setIsAuthenticated(hasSession)
      
      if (hasSession && data.session.user) {
        const role = data.session.user.user_metadata?.role || 'user'
        setIsAdmin(role === 'admin')
      } else {
        setIsAdmin(false)
      }
      
      setChecking(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      const hasSession = !!session
      setIsAuthenticated(hasSession)
      
      if (hasSession && session.user) {
        const role = session.user.user_metadata?.role || 'user'
        setIsAdmin(role === 'admin')
      } else {
        setIsAdmin(false)
      }
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 flex items-center justify-center">
        <div className="text-emerald-400 text-lg">Verificando permissões...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-2xl mb-4">⛔ Acesso Negado</div>
          <p className="text-emerald-300">Você não tem permissão para acessar esta área.</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}