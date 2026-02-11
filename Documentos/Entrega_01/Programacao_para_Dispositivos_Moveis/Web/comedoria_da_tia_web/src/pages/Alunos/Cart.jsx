import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CreditCard,
  User,
  Mail,
  IdCard,
  QrCode,
  Copy,
  CheckCircle2,
  X
} from 'lucide-react'
import { useCart } from '../../context/CartContext'
import supabase from '../../lib/supabaseClient'

export default function Cart() {
  const navigate = useNavigate()
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Estados do pagamento PIX fake
  const [showPixModal, setShowPixModal] = useState(false)
  const [pixCode, setPixCode] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [pixProcessing, setPixProcessing] = useState(false)

  // Verificar perfil do usuário da sessão
  useEffect(() => {
    async function getProfile() {
      try {
        setProfileLoading(true)

        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (!session?.user) {
          setProfile(null)
          return
        }

        const baseProfile = {
          id: session.user.id,
          email: session.user.email ?? '',
          ra: session.user.user_metadata?.ra ?? '',
          full_name:
            session.user.user_metadata?.full_name ??
            session.user.user_metadata?.name ??
            'Cliente',
          role: session.user.user_metadata?.role ?? null
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, email, ra, full_name, role')
          .eq('id', session.user.id) // se sua coluna for user_id, troque aqui
          .single()

        if (error) {
          console.warn('Erro ao buscar perfil na tabela profiles, usando dados do auth:', error)
          setProfile(baseProfile)
        } else if (!profileData) {
          console.warn('Nenhum perfil encontrado na tabela profiles, usando dados do auth.')
          setProfile(baseProfile)
        } else {
          setProfile(profileData)
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error)
        setProfile(null)
      } finally {
        setProfileLoading(false)
      }
    }

    getProfile()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (!session?.user) {
          setProfile(null)
          return
        }

        const baseProfile = {
          id: session.user.id,
          email: session.user.email ?? '',
          ra: session.user.user_metadata?.ra ?? '',
          full_name:
            session.user.user_metadata?.full_name ??
            session.user.user_metadata?.name ??
            'Cliente',
          role: session.user.user_metadata?.role ?? null
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, email, ra, full_name, role')
          .eq('id', session.user.id) // se for user_id, troque aqui também
          .single()

        if (error) {
          console.warn('Erro ao buscar perfil na mudança de auth, usando dados do auth:', error)
          setProfile(baseProfile)
        } else if (!profileData) {
          console.warn('Nenhum perfil encontrado (onAuthStateChange), usando dados do auth.')
          setProfile(baseProfile)
        } else {
          setProfile(profileData)
        }
      } catch (error) {
        console.error('Erro ao atualizar perfil na mudança de auth:', error)
        setProfile(null)
      }
    })

    return () => {
      subscription?.unsubscribe?.()
    }
  }, [])

  // Gera um código PIX "copia e cola" FAKE apenas para demonstração
  function generateFakePixCode(total, profile) {
    const amount = Number(total || 0).toFixed(2)
    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase()
    const ra = profile?.ra || '0000000'

    // NÃO É UM CÓDIGO PIX REAL – apenas para demo visual
    return `00020126360014BR.GOV.BCB.PIX0114+5500000000005204000053039865802BR5915COMEDORIA FECAP6009SAO PAULO62070503***6304${randomSuffix}-RA${ra}-V${amount}`
  }

  // Abre o modal de PIX com código fake gerado
  const handleOpenPixPayment = () => {
    if (profileLoading) {
      alert('Carregando dados do seu perfil. Aguarde um instante e tente novamente.')
      return
    }

    if (!profile) {
      alert('Não foi possível carregar seus dados de usuário. Verifique se está logado.')
      return
    }

    if (items.length === 0) {
      alert('Seu carrinho está vazio!')
      return
    }

    const code = generateFakePixCode(total, profile)
    setPixCode(code)
    setShowPixModal(true)
  }

  // Finaliza o pedido DEPOIS de "simular" o pagamento PIX
  const finalizeOrderAfterPix = async () => {
    if (!profile) {
      alert('Erro ao identificar usuário. Tente novamente.')
      return
    }

    if (items.length === 0) {
      alert('Seu carrinho está vazio!')
      return
    }

    setCheckoutLoading(true)
    try {
      const orderPromises = items.map(async item => {
        const orderData = {
          id: crypto.randomUUID(),
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          status: 'validado', // teste
          order_date: new Date().toISOString(),
          user_id: profile.id,
          user_ra: profile.ra,
          user_name: profile.full_name || 'Cliente'
        }

        const { error } = await supabase.from('pedidos_teste').insert(orderData)

        if (error) throw error
        return orderData
      })

      await Promise.all(orderPromises)

      alert('Pagamento simulado com sucesso! Pedido registrado e em breve estará pronto para retirada.')
      clearCart()
      navigate('/app/alunos/home')
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error)
      alert('Erro ao finalizar pedido. Tente novamente.')
    } finally {
      setCheckoutLoading(false)
      setPixProcessing(false)
      setShowPixModal(false)
    }
  }

  const handleSimulatePixPayment = async () => {
    setPixProcessing(true)
    // pequena "animação" de tempo de processamento fake
    setTimeout(() => {
      finalizeOrderAfterPix()
    }, 1200)
  }

  const handleCopyPixCode = async () => {
    if (!pixCode) return
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopyFeedback('Código copiado!')
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (err) {
      console.error('Erro ao copiar código PIX:', err)
      setCopyFeedback('Não foi possível copiar. Copie manualmente.')
      setTimeout(() => setCopyFeedback(''), 3000)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0f172a] via-35% to-[#065f46] flex items-center justify-center p-4">
        <div className="text-center bg-[#0f172a]/80 backdrop-blur-sm rounded-2xl p-8 border border-emerald-800/30 max-w-md w-full">
          <ShoppingCart size={64} className="mx-auto mb-4 text-emerald-400 opacity-80" />
          <h2 className="text-2xl font-bold text-emerald-50 mb-2">Seu carrinho está vazio</h2>
          <p className="text-emerald-200 mb-6">Adicione alguns produtos deliciosos!</p>
          <button
            onClick={() => navigate('/app/alunos/home')}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all active:scale-95"
          >
            Continuar Comprando
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0f172a] via-35% to-[#065f46] pb-32">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/app/alunos/home')}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f172a]/80 border border-emerald-800/30 rounded-lg text-emerald-50 hover:bg-[#0f172a] backdrop-blur-sm transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-emerald-400">
            <ShoppingCart size={24} />
            Meu Carrinho
          </h1>
          <button
            onClick={clearCart}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400 hover:bg-red-600/30 backdrop-blur-sm transition-colors"
          >
            <Trash2 size={16} />
            Limpar
          </button>
        </div>

        {/* Informações do Usuário */}
        {profile && (
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-emerald-800/30 rounded-xl p-6 mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-emerald-800/30">
              <User size={20} className="text-emerald-400" />
              <h3 className="text-lg font-semibold text-emerald-50">Informações do Pedido</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-emerald-300">
                  <User size={16} className="text-emerald-400" />
                  <span className="font-medium">Nome:</span>
                </div>
                <span className="text-emerald-50 font-semibold">
                  {profile.full_name || 'Não informado'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-emerald-300">
                  <IdCard size={16} className="text-emerald-400" />
                  <span className="font-medium">RA:</span>
                </div>
                <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {profile.ra || '—'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Mail size={16} className="text-emerald-400" />
                  <span className="font-medium">Email:</span>
                </div>
                <span className="text-emerald-50 font-medium text-sm">
                  {profile.email}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Itens */}
        <div className="space-y-4 mb-8">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-[#0f172a]/70 border border-emerald-800/30 rounded-xl p-4 backdrop-blur-sm hover:translate-y-[-2px] transition-all"
            >
              <div className="flex gap-4">
                {/* Imagem do Produto */}
                <img
                  src={item.image_url || '/placeholder.svg'}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />

                {/* Detalhes do Produto */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-emerald-50 text-lg mb-2">{item.name}</h3>

                  {/* Preços em linha */}
                  <div className="flex items-center gap-3 mb-3">
                    {item.is_promotion_active ? (
                      <>
                        <span className="text-red-400 line-through text-sm">
                          {fmtMoney(item.original_price)}
                        </span>
                        <span className="text-emerald-400 font-bold text-lg">
                          {fmtMoney(item.price)}
                        </span>
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                          PROMO
                        </span>
                      </>
                    ) : (
                      <span className="text-emerald-400 font-bold text-lg">
                        {fmtMoney(item.price)}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-emerald-300 text-sm mb-3">{item.description}</p>
                  )}

                  {/* Subtotal em linha com controles */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Controle de Quantidade */}
                      <div className="flex items-center gap-2 bg-[#0b1220] rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-emerald-800/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={16} className="text-emerald-400" />
                        </button>

                        <span className="text-emerald-50 font-semibold min-w-8 text-center">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-emerald-800/30 transition-colors"
                        >
                          <Plus size={16} className="text-emerald-400" />
                        </button>
                      </div>

                      {/* Botão Remover */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-600/20 text-red-400 transition-colors"
                        title="Remover item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Subtotal em linha */}
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-300 text-sm">Subtotal:</span>
                      <span className="text-emerald-50 font-bold text-lg">
                        {fmtMoney(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo do Pedido */}
        <div className="bg-[#0f172a]/70 border border-emerald-800/30 rounded-xl p-6 backdrop-blur-sm sticky bottom-6">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-emerald-200">
              <span>Subtotal:</span>
              <span className="font-semibold">{fmtMoney(total)}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-200">
              <span>Taxa de entrega:</span>
              <span className="text-emerald-400 font-semibold">Grátis</span>
            </div>
            <div className="flex justify-between items-center text-emerald-50 text-lg font-bold pt-3 border-t border-emerald-800/30">
              <span>Total:</span>
              <span className="text-xl">{fmtMoney(total)}</span>
            </div>
          </div>

          {/* Botão que agora abre o fluxo PIX fake */}
          <button
            onClick={handleOpenPixPayment}
            disabled={checkoutLoading || pixProcessing || profileLoading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkoutLoading || pixProcessing || profileLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {profileLoading ? 'Carregando dados...' : 'Processando...'}
              </>
            ) : (
              <>
                <CreditCard size={20} />
                Pagar com PIX (demo)
              </>
            )}
          </button>

          {profile && (
            <div className="text-center mt-4 p-3 bg-emerald-900/20 border border-emerald-800/30 rounded-lg">
              <small className="text-emerald-400">
                ✅ Pedido será registrado para{' '}
                <strong className="text-emerald-300">{profile.full_name || 'Cliente'}</strong> (RA:{' '}
                {profile.ra || '—'})
              </small>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE PAGAMENTO PIX FAKE */}
      {showPixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#020617] border border-emerald-700/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            {/* Botão fechar */}
            <button
              onClick={() => !pixProcessing && setShowPixModal(false)}
              className="absolute right-4 top-4 text-emerald-100/70 hover:text-emerald-300 disabled:opacity-40"
              disabled={pixProcessing}
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/40">
                <QrCode className="text-emerald-300" size={22} />
              </div>
            <div>
                <h2 className="text-xl font-semibold text-emerald-50">Pagamento PIX (Demo)</h2>
                <p className="text-xs text-emerald-300/80">
                  Este é apenas um fluxo de demonstração. Nenhum pagamento real é efetuado.
                </p>
              </div>
            </div>

            <div className="bg-[#0b1220] border border-emerald-900/40 rounded-xl p-4 mb-4 flex flex-col items-center">
              {/* QR fake apenas visual */}
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
                <div className="absolute inset-2 grid grid-cols-6 grid-rows-6 gap-[2px]">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-full h-full ${
                        i % 3 === 0 || i % 5 === 0 ? 'bg-black' : 'bg-white'
                      }`}
                    />
                  ))}
                </div>
                <span className="absolute bottom-1 text-[9px] font-semibold text-gray-400">
                  QR CODE PIX DEMO
                </span>
              </div>

              <div className="w-full text-center">
                <p className="text-xs text-emerald-200/90 mb-1">Valor do pagamento (fake)</p>
                <p className="text-2xl font-bold text-emerald-400">{fmtMoney(total)}</p>
                {profile?.ra && (
                  <p className="text-xs text-emerald-300/80 mt-1">
                    Vinculado ao RA: <span className="font-semibold">{profile.ra}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Código PIX copia e cola fake */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-emerald-200 mb-1">
                Código PIX copia e cola (fake)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-[#020617] border border-emerald-900/60 px-3 py-2 text-xs text-emerald-100 max-h-16 overflow-y-auto whitespace-pre-wrap break-all">
                  {pixCode}
                </div>
                <button
                  onClick={handleCopyPixCode}
                  className="flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                >
                  <Copy size={14} className="mr-1" />
                  Copiar
                </button>
              </div>
              {copyFeedback && (
                <p className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  {copyFeedback}
                </p>
              )}
            </div>

            <div className="bg-emerald-900/10 border border-emerald-900/40 rounded-lg p-3 mb-4 text-[11px] text-emerald-200/90">
              <p className="font-semibold mb-1">Como funciona o demo:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Escaneie o QR ou copie o código apenas para fins de apresentação.</li>
                <li>Nenhum valor será realmente cobrado.</li>
                <li>
                  Clique em <span className="font-bold">"Simular pagamento aprovado"</span> para
                  registrar o pedido no sistema.
                </li>
              </ul>
            </div>

            <button
              onClick={handleSimulatePixPayment}
              disabled={pixProcessing || checkoutLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pixProcessing || checkoutLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Confirmando pagamento fake...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Simular pagamento aprovado
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtMoney(n) {
  if (n == null) return '—'
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `R$ ${num.toFixed(2).replace('.', ',')}`
}
