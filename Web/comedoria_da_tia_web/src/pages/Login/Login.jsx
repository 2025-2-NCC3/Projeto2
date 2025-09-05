import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import { Mail, Lock, ChefHat } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Input from '../../components/Input'
import supabase from '../../lib/supabaseClient'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberEmail, setRememberEmail] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const emailKey = useMemo(() => 'ctia:rememberEmail', [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(emailKey)
      if (saved) {
        setEmail(saved)
        setRememberEmail(true)
      }
    } catch {/* ignore */}
  }, [emailKey])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Informe um e-mail válido ❌')
      return
    }
    if (!password) {
      toast.error('Digite sua senha ❌')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const msg = /invalid/i.test(error.message)
          ? 'Credenciais inválidas. Verifique e tente novamente ❌'
          : error.message
        toast.error(msg)
        return
      }

      try {
        if (rememberEmail) localStorage.setItem(emailKey, email)
        else localStorage.removeItem(emailKey)
      } catch {/* ignore */}

      toast.success('Login realizado com sucesso ✅')
      setTimeout(() => navigate('/app', { replace: true }), 350)
    } catch {
      toast.error('Falha ao entrar. Tente novamente ❌')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="login-card"
      >
        <div className="login-header">
          <div className="login-logo">
            <ChefHat className="icon" />
          </div>
          <h2 className="login-title">Entrar no Painel</h2>
          <p className="login-subtitle">Comedoria da Tia</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            icon={Mail}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            icon={Lock}
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="login-row">
            <label className="remember">
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
              />
              Lembrar e-mail
            </label>
            <Link to="/esqueceu-a-senha" className="link">
              Esqueci minha senha
            </Link>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-gradient"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando…' : 'Entrar'}
          </motion.button>

          <p className="signup">
            Não tem conta? <Link to="/inscreva-se" className="link">Criar conta</Link>
          </p>
        </form>
      </motion.div>
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  )
}
