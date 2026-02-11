import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, CreditCard, User, Mail, IdCard } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import supabase from '../../lib/supabaseClient'

export default function Cart() {
  const navigate = useNavigate()
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [profile, setProfile] = useState(null)

  // Verificar perfil do usuário da sessão
  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('id, email, ra, full_name, role')
            .eq('id', session.user.id)
            .single()

          if (error) {
            console.error('Erro ao buscar perfil:', error)
          } else {
            setProfile(profileData)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error)
      }
    }

    getProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, email, ra, full_name, role')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Erro ao buscar perfil:', error)
        } else {
          setProfile(profileData)
        }
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleCheckout = async () => {
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
      const orderPromises = items.map(async (item) => {
        const orderData = {
          id: crypto.randomUUID(),
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          status: 'validado',
          order_date: new Date().toISOString(),
          user_id: profile.id,
          user_ra: profile.ra,
          user_name: profile.full_name || 'Cliente'
        }

        const { error } = await supabase
          .from('pedidos_teste')
          .insert(orderData)

        if (error) throw error
        return orderData
      })

      await Promise.all(orderPromises)
      
      alert('Pedido realizado com sucesso! Em breve estará pronto para retirada.')
      clearCart()
      navigate('/app/alunos/home')
      
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error)
      alert('Erro ao finalizar pedido. Tente novamente.')
    } finally {
      setCheckoutLoading(false)
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
                  {profile.ra}
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
          {items.map((item) => (
            <div key={item.id} className="bg-[#0f172a]/70 border border-emerald-800/30 rounded-xl p-4 backdrop-blur-sm hover:translate-y-[-2px] transition-all">
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

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkoutLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando Pedido...
              </>
            ) : (
              <>
                <CreditCard size={20} />
                Finalizar Pedido
              </>
            )}
          </button>

          {profile && (
            <div className="text-center mt-4 p-3 bg-emerald-900/20 border border-emerald-800/30 rounded-lg">
              <small className="text-emerald-400">
                ✅ Pedido será registrado para <strong className="text-emerald-300">{profile.full_name || 'Cliente'}</strong> (RA: {profile.ra})
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function fmtMoney(n) {
  if (n == null) return "—"
  const num = Number(n)
  if (Number.isNaN(num)) return "—"
  return `R$ ${num.toFixed(2).replace(".", ",")}`
}