import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, ChefHat, BookOpen } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Input from '../../components/Input'
import supabase from '../../lib/supabaseClient'
import './Signup.css'

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [ra, setRa] = useState('') // ✅ CAMPO RA
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const isValidEmail = val => /\S+@\S+\.\S+/.test(val)
  const isValidRA = val => /^[0-9]{6,20}$/.test(val) // ✅ VALIDAÇÃO DO RA

  // ✅ FUNÇÃO DE FALLBACK ATUALIZADA COM RA
  const ensureUserProfile = async user => {
    try {
      // Tentativa 1: Verificar se profile já existe
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        console.log('✅ Profile já existe')
        return { success: true, method: 'existing' }
      }

      if (checkError && checkError.code !== 'PGRST116') {
        console.warn('⚠️ Erro ao verificar profile:', checkError)
      }

      // Tentativa 2: Criar profile com dados completos (INCLUINDO RA)
      const profileData = {
        id: user.id,
        full_name: name.trim(),
        email: email.toLowerCase(),
        ra: ra.trim(), // ✅ INCLUINDO RA
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (insertError) {
        console.warn('❌ Tentativa 2 de criar profile falhou:', insertError)

        // Tentativa 3: Criar profile com dados mínimos (INCLUINDO RA)
        const minimalProfileData = {
          id: user.id,
          email: email.toLowerCase(),
          ra: ra.trim(), // ✅ INCLUINDO RA MESMO NO FALLBACK
          role: 'user',
          created_at: new Date().toISOString()
        }

        const { error: minimalError } = await supabase
          .from('profiles')
          .insert(minimalProfileData)

        if (minimalError) {
          console.error('❌ Todas as tentativas de criar profile falharam:', minimalError)
          return { success: false, error: minimalError }
        }

        console.log('✅ Profile criado com dados mínimos (fallback)')
        return { success: true, method: 'minimal_fallback' }
      }

      console.log('✅ Profile criado com sucesso')
      return { success: true, method: 'created' }
    } catch (error) {
      console.error('💥 Erro inesperado no ensureUserProfile:', error)
      return { success: false, error }
    }
  }

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

    // ✅ VALIDAÇÃO DO RA
    if (!isValidRA(ra)) {
      toast.error('Informe um RA válido (apenas números, 6-20 dígitos) ❌')
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
      // 1. Criar usuário no Auth (MANDANDO RA NO METADATA ✅)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            ra: ra.trim(), // ✅ ESSENCIAL PRO TRIGGER
            role: 'user'
          },
          // ✅ REDIRECT para a tela de callback após confirmar o e-mail
          emailRedirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/signup-callback`
              : undefined
        }
      })

      if (authError) {
        console.error('Erro do Supabase Auth:', authError)
        toast.error(authError.message || 'Falha ao criar conta ❌')
        return
      }

      // 2. ✅ FALLBACK: Garantir que profile existe (AGORA COM RA)
      if (authData?.user) {
        const profileResult = await ensureUserProfile(authData.user)

        if (!profileResult.success) {
          console.warn('⚠️ Profile não pôde ser criado, mas usuário foi registrado')
          // Não bloqueia o cadastro - usuário pode completar profile depois
        }
      }

      toast.success('Conta criada! Verifique seu e-mail para confirmar ✅')

      // Opcional: redirecionar localmente para login depois de alguns segundos
      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (error) {
      console.error('Erro no signup:', error)
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
            onChange={e => setName(e.target.value)}
            required
          />

          <Input
            icon={Mail}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          {/* ✅ CAMPO RA */}
          <Input
            icon={BookOpen}
            type="text"
            placeholder="RA (apenas números)"
            value={ra}
            onChange={e => setRa(e.target.value.replace(/\D/g, ''))} // Remove não-números
            required
          />

          <Input
            icon={Lock}
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <Input
            icon={Lock}
            type="password"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />

          <label className="terms">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={e => setAcceptTerms(e.target.checked)}
            />
            <span>
              Aceito os{' '}
              <Link to="/termos" className="link">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link to="/privacidade" className="link">
                Política de Privacidade
              </Link>
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
            Já possui conta?{' '}
            <Link to="/login" className="link">
              Entrar
            </Link>
          </p>
        </form>
      </motion.div>
      <Toaster position="top-center" />
    </div>
  )
}
