import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChefHat, CheckCircle2, AlertTriangle } from 'lucide-react'
import supabase from '../../lib/supabaseClient'
import '../Signup/Signup.css'

export default function SignupCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('Validando seu cadastro...')

  useEffect(() => {
    let timeoutId

    async function verifyUser() {
      try {
        // Supabase deve recuperar a sessão a partir do link de confirmação
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          console.error('Erro ao obter usuário no callback:', error)
          setStatus('error')
          setMessage(
            'Não foi possível validar seu cadastro automaticamente. Tente entrar com seu e-mail e senha.'
          )
          return
        }

        const user = data?.user

        if (!user) {
          setStatus('error')
          setMessage(
            'Não encontramos uma sessão ativa. Tente entrar com seu e-mail e senha para continuar.'
          )
          return
        }

        // Se o e-mail já foi confirmado, ótimo
        const emailConfirmed =
          user.email_confirmed_at || user.confirmed_at || user.app_metadata?.provider === 'email'

        if (emailConfirmed) {
          setStatus('success')
          setMessage('Seu e-mail foi confirmado com sucesso! Você já pode entrar no painel.')

          // Redireciona para login depois de alguns segundos
          timeoutId = setTimeout(() => {
            navigate('/login', { replace: true })
          }, 3000)
        } else {
          setStatus('success')
          setMessage(
            'Conta criada! Assim que você confirmar o e-mail poderá acessar o painel da Comedoria.'
          )
        }
      } catch (err) {
        console.error('Erro inesperado no callback:', err)
        setStatus('error')
        setMessage(
          'Ocorreu um erro ao validar seu cadastro. Tente novamente ou faça login com seu e-mail e senha.'
        )
      }
    }

    verifyUser()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [navigate])

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const isError = status === 'error'

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
          <h2 className="signup-title">
            {isLoading && 'Confirmando cadastro'}
            {isSuccess && 'Tudo pronto!'}
            {isError && 'Algo deu errado'}
          </h2>
          <p className="signup-subtitle">Comedoria da Tia — Painel</p>
        </div>

        <div className="signup-form">
          <div className="flex flex-col items-center text-center gap-4">
            {isLoading && (
              <>
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-300">{message}</p>
              </>
            )}

            {isSuccess && (
              <>
                <CheckCircle2 className="text-emerald-400" size={48} />
                <p className="text-sm text-gray-200">{message}</p>
                <p className="text-xs text-gray-400">
                  Você será redirecionado para a tela de login em alguns segundos...
                </p>
                <button
                  onClick={() => navigate('/login', { replace: true })}
                  className="btn-gradient mt-2"
                >
                  Ir para o login agora
                </button>
              </>
            )}

            {isError && (
              <>
                <AlertTriangle className="text-yellow-400" size={48} />
                <p className="text-sm text-gray-200">{message}</p>
                <div className="flex flex-col gap-2 mt-2 w-full">
                  <button
                    onClick={() => navigate('/login', { replace: true })}
                    className="btn-gradient"
                  >
                    Ir para o login
                  </button>
                  <p className="text-xs text-gray-400">
                    Se o problema continuar, tente criar a conta novamente na página de{' '}
                    <Link to="/signup" className="link">
                      cadastro
                    </Link>
                    .
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
