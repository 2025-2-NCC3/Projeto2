import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import { User, Mail, Lock, ChefHat, ShieldCheck } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Input from '../../components/Input'
import supabase from '../../lib/supabaseClient'
import './Signup.css'

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const isValidEmail = (val) => /\S+@\S+\.\S+/.test(val)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!name.trim() || name.trim().length < 2) {
      toast.error('Informe seu nome completo ❌')
      return
    }
    if (!isValidEmail(email)) {
      toast.error('Informe um e-mail válido ❌')
      return
    }
    if (!password || password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres ❌')
      return
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem ❌')
      return
    }
    if (!acceptTerms) {
      toast.error('Você precisa aceitar os termos de uso ❌')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
        },
      })

      if (error) {
        toast.error(error.message || 'Falha ao criar conta ❌')
        return
      }

      toast.success('Conta criada! Verifique seu e-mail para confirmar ✅')
      setTimeout(() => navigate('/login', { replace: true }), 800)
    } catch {
      toast.error('Ocorreu um erro inesperado ❌')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="signup-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="signup-card"
      >
        <div className="signup-header">
          <div className="signup-logo">
            <ChefHat className="icon" />
          </div>
          <h2 className="signup-title">Criar conta</h2>
          <p className="signup-subtitle">Comedoria da Tia — Painel</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <Input
            icon={User}
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            icon={Lock}
            type="password"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <label className="terms">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <span>
              Aceito os <Link to="/termos" className="link">Termos de Uso</Link> e a{' '}
              <Link to="/privacidade" className="link">Política de Privacidade</Link>
            </span>
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-gradient"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Criando…' : 'Criar conta'}
          </motion.button>

          <p className="login">
            Já possui conta? <Link to="/login" className="link">Entrar</Link>
          </p>
        </form>
      </motion.div>
      <Toaster position="top-center" />
    </div>
  )
}
