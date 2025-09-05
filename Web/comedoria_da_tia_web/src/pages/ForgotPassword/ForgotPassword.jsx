import { useState } from 'react'
import { Link } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import { Mail, ChefHat, ArrowLeftCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Input from '../../components/Input'
import supabase from '../../lib/supabaseClient'
import './ForgotPassword.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isValidEmail = (val) => /\S+@\S+\.\S+/.test(val)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!isValidEmail(email)) {
      toast.error('Informe um e-mail válido ❌')
      return
    }

    setIsLoading(true)
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

      if (error) {
        toast.error(error.message || 'Não foi possível enviar o e-mail de recuperação ❌')
        return
      }

      toast.success('Enviamos um link para redefinir sua senha ✅\nConfira sua caixa de entrada e spam.')
    } catch {
      toast.error('Ocorreu um erro inesperado ❌')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="forgot-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="forgot-card"
      >
        <div className="forgot-header">
          <div className="forgot-logo">
            <ChefHat className="icon" />
          </div>
          <h2 className="forgot-title">Esqueceu a senha</h2>
          <p className="forgot-subtitle">Informe seu e-mail para receber o link de recuperação</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-form">
          <Input
            icon={Mail}
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-gradient"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Enviando…' : 'Enviar link de recuperação'}
          </motion.button>

          <div className="back">
            <ArrowLeftCircle size={18} />
            <Link to="/login" className="link">Voltar para o login</Link>
          </div>
        </form>
      </motion.div>
      <Toaster position="top-center" />
    </div>
  )
}
