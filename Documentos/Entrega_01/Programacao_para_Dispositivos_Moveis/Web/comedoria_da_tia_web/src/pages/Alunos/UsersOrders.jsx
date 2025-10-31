import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, Package, Truck, User, RefreshCw } from 'lucide-react'
import supabase from '../../lib/supabaseClient'
import { useNotifier } from '../../components/Notifier/useNotifier'

function fmtMoney(n) {
  if (n == null) return "—"
  const num = Number(n)
  if (Number.isNaN(num)) return "—"
  return `R$ ${num.toFixed(2).replace(".", ",")}`
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('pt-BR')
}

export default function UsersOrders() {
  const { notify, NotifierHost } = useNotifier()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Verificar perfil do usuário
  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('id, email, ra, full_name')
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
  }, [])

  // Carregar pedidos do usuário
  const loadUserOrders = async () => {
    if (!profile) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pedidos_teste')
        .select(`
          *,
          produtos_teste (
            name,
            image_url
          )
        `)
        .eq('user_id', profile.id) // Filtra apenas os pedidos do usuário
        .order('order_date', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      notify({
        type: 'error',
        title: 'Erro ao carregar pedidos',
        message: error.message
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (profile) {
      loadUserOrders()
    }
  }, [profile])

  // Atualização em tempo real com Supabase Realtime
  useEffect(() => {
    if (!profile) return

    // Inscrever-se para atualizações em tempo real
    const subscription = supabase
      .channel('pedidos_teste')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'pedidos_teste',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('Mudança em tempo real:', payload)
          
          if (payload.eventType === 'INSERT') {
            // Novo pedido adicionado
            setOrders(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            // Pedido atualizado
            setOrders(prev => prev.map(order => 
              order.id === payload.new.id ? { ...order, ...payload.new } : order
            ))
          } else if (payload.eventType === 'DELETE') {
            // Pedido removido
            setOrders(prev => prev.filter(order => order.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [profile])

  const refreshOrders = async () => {
    setRefreshing(true)
    await loadUserOrders()
  }

  const getStatusText = (status) => {
    const statusMap = {
      'validado': 'Validado',
      'em_preparo': 'Em Preparo', 
      'retira': 'Pronto para Retirada'
    }
    return statusMap[status] || status
  }

  const getStatusIcon = (status) => {
    const iconMap = {
      'validado': <CheckCircle size={16} />,
      'em_preparo': <Package size={16} />,
      'retira': <Truck size={16} />
    }
    return iconMap[status] || <Clock size={16} />
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'validado': 'text-green-400 bg-green-900/30 border-green-800/50',
      'em_preparo': 'text-orange-400 bg-orange-900/30 border-orange-800/50',
      'retira': 'text-blue-400 bg-blue-900/30 border-blue-800/50'
    }
    return colorMap[status] || 'text-gray-400 bg-gray-900/30 border-gray-800/50'
  }

  const getStatusDescription = (status) => {
    const descriptionMap = {
      'validado': 'Seu pedido foi confirmado e está na fila',
      'em_preparo': 'Seu pedido está sendo preparado',
      'retira': 'Seu pedido está pronto para retirada!'
    }
    return descriptionMap[status] || 'Status do pedido'
  }

  const activeOrders = orders.filter(order => order.status !== 'retira')
  const completedOrders = orders.filter(order => order.status === 'retira')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0f172a] via-35% to-[#065f46] flex items-center justify-center">
        <NotifierHost />
        <div className="text-emerald-400 text-lg">Carregando seus pedidos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0f172a] via-35% to-[#065f46] pb-32">
      <NotifierHost />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate('/app/alunos/home')}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f172a]/80 border border-emerald-800/30 rounded-lg text-emerald-50 hover:bg-[#0f172a] backdrop-blur-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-emerald-400">Meus Pedidos</h1>
          <button
            onClick={refreshOrders}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f172a]/80 border border-emerald-800/30 rounded-lg text-emerald-50 hover:bg-[#0f172a] backdrop-blur-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        {/* Informações do Usuário */}
        {profile && (
          <div className="mb-8 p-4 bg-[#0f172a]/50 rounded-lg border border-emerald-800/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <User size={20} className="text-emerald-400" />
              <div>
                <h3 className="font-semibold text-emerald-50">{profile.full_name || 'Cliente'}</h3>
                <p className="text-sm text-emerald-400">RA: {profile.ra}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pedidos Ativos */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-emerald-300">
              <Clock size={20} />
              Pedidos Ativos ({activeOrders.length})
            </h2>
            {activeOrders.length > 0 && (
              <div className="text-sm text-emerald-400">
                Atualizando automaticamente...
              </div>
            )}
          </div>

          {activeOrders.length === 0 ? (
            <div className="text-center py-12 text-emerald-400 bg-[#0f172a]/50 rounded-lg border-2 border-dashed border-emerald-800/50 backdrop-blur-sm">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum pedido ativo</h3>
              <p className="mb-4">Seus pedidos aparecerão aqui quando estiverem em andamento</p>
              <button
                onClick={() => navigate('/app/alunos/home')}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all"
              >
                Fazer um Pedido
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  statusDescription={getStatusDescription(order.status)}
                  statusColor={getStatusColor(order.status)}
                  statusIcon={getStatusIcon(order.status)}
                  statusText={getStatusText(order.status)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pedidos Finalizados */}
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-emerald-300 mb-6">
            <CheckCircle size={20} />
            Pedidos Finalizados ({completedOrders.length})
          </h2>

          {completedOrders.length === 0 ? (
            <div className="text-center py-8 text-emerald-400 bg-[#0f172a]/50 rounded-lg border border-emerald-800/30 backdrop-blur-sm">
              Nenhum pedido finalizado ainda
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  statusDescription="Pedido finalizado e entregue"
                  statusColor={getStatusColor(order.status)}
                  statusIcon={getStatusIcon(order.status)}
                  statusText={getStatusText(order.status)}
                  isCompleted
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, statusDescription, statusColor, statusIcon, statusText, isCompleted = false }) {
  const product = order.produtos_teste

  return (
    <div className={`bg-[#0f172a]/70 border border-emerald-800/30 rounded-2xl p-6 backdrop-blur-sm hover:translate-y-[-2px] transition-all ${
      isCompleted ? 'opacity-80' : ''
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-emerald-50">Pedido #{order.id.slice(-8)}</h3>
          <p className="text-sm text-emerald-400">
            {formatDate(order.order_date)}
          </p>
        </div>
        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
          {statusIcon}
          {statusText}
        </span>
      </div>

      {/* Descrição do Status */}
      <div className="mb-4 p-3 bg-[#0b1220]/50 rounded-lg border border-emerald-800/30">
        <p className="text-sm text-emerald-300">{statusDescription}</p>
      </div>

      {/* Produto */}
      <div className="flex gap-3 mb-4">
        {product?.image_url && (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <h4 className="font-medium text-emerald-50 mb-2">{product?.name || 'Produto não encontrado'}</h4>
          <div className="flex justify-between text-sm text-emerald-400">
            <span>Quantidade: {order.quantity}</span>
            <span>Unitário: {fmtMoney(order.unit_price)}</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-4 border-t border-emerald-800/30">
        <span className="font-semibold text-emerald-50">Total:</span>
        <span className="font-bold text-lg text-emerald-400">{fmtMoney(order.total_price)}</span>
      </div>

      {/* Timeline */}
      {!isCompleted && (
        <div className="mt-4 pt-4 border-t border-emerald-800/30">
          <div className="flex justify-between items-center">
            {['validado', 'em_preparo', 'retira'].map((status, index) => (
              <div key={status} className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  ['validado', 'em_preparo', 'retira'].indexOf(order.status) >= index
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-[#0b1220] text-emerald-400 border border-emerald-800/50'
                }`}>
                  {getStatusIcon(status)}
                </div>
                <span className="text-xs mt-1 text-emerald-400 text-center">
                  {getStatusText(status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Funções auxiliares para o OrderCard
function getStatusText(status) {
  const statusMap = {
    'validado': 'Validado',
    'em_preparo': 'Preparando',
    'retira': 'Pronto'
  }
  return statusMap[status] || status
}

function getStatusIcon(status) {
  const iconMap = {
    'validado': <CheckCircle size={12} />,
    'em_preparo': <Package size={12} />,
    'retira': <Truck size={12} />
  }
  return iconMap[status] || <Clock size={12} />
}