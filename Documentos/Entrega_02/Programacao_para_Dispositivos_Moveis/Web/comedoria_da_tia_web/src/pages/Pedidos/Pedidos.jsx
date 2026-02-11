import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, Package, Truck, User } from 'lucide-react'
import supabase from '../../lib/supabaseClient'
import { useNotifier } from '../../components/Notifier/useNotifier'

function fmtMoney(n) {
  if (n == null) return "—"
  const num = Number(n)
  if (Number.isNaN(num)) return "—"
  return `R$ ${num.toFixed(2).replace(".", ",")}`
}

export default function AdminOrders() {
  const { notify, NotifierHost } = useNotifier()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const loadOrders = async () => {
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
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const updateOrderStatus = async (orderId, newStatus) => {
  try {
    setUpdating(orderId)
    
    console.log('Atualizando pedido:', {
      orderId,
      newStatus,
      type: typeof orderId
    })

    // Verificar se o pedido existe antes de atualizar
    const { data: existingOrder, error: checkError } = await supabase
      .from('pedidos_teste')
      .select('id')
      .eq('id', orderId)
      .single()

    if (checkError) {
      console.error('Pedido não encontrado:', checkError)
      throw new Error(`Pedido ${orderId} não encontrado`)
    }

    console.log('Pedido encontrado, atualizando status...')

    // Fazer o UPDATE (não PATCH)
    const { error } = await supabase
      .from('pedidos_teste')
      .update({ 
        status: newStatus
        // Removi updated_at pois não existe na sua tabela
      })
      .eq('id', orderId)

    if (error) throw error

    console.log('Pedido atualizado com sucesso')

    // Atualizar estado local
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ))

    notify({
      type: 'success',
      title: 'Status atualizado',
      message: `Pedido atualizado para ${getStatusText(newStatus)}`
    })
  } catch (error) {
    console.error('Erro detalhado ao atualizar pedido:', error)
    notify({
      type: 'error',
      title: 'Erro ao atualizar',
      message: error.message || 'Erro desconhecido ao atualizar pedido'
    })
  } finally {
    setUpdating(null)
  }
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

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'validado': 'em_preparo',
      'em_preparo': 'retira',
      'retira': null
    }
    return statusFlow[currentStatus]
  }

  const openOrders = orders.filter(order => order.status !== 'retira')
  const completedOrders = orders.filter(order => order.status === 'retira')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 flex items-center justify-center">
        <NotifierHost />
        <div className="text-emerald-400 text-lg">Carregando pedidos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 pb-32">
      <NotifierHost />

      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <Link 
            to="/app/produtos" 
            className="flex items-center gap-2 px-4 py-2 bg-emerald-900/50 border border-emerald-800/30 rounded-lg text-emerald-50 hover:bg-emerald-800/50 backdrop-blur-sm"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-emerald-400">Gerenciar Pedidos</h1>
          <div className="flex gap-4 text-sm text-emerald-300">
            <span className="bg-emerald-900/50 px-3 py-1 rounded-full">{openOrders.length} em aberto</span>
            <span className="bg-emerald-900/50 px-3 py-1 rounded-full">{completedOrders.length} finalizados</span>
          </div>
        </div>

        {/* Pedidos em Aberto */}
        <div className="mb-12">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-emerald-300 mb-6">
            <Clock size={20} />
            Pedidos em Aberto ({openOrders.length})
          </h2>

          {openOrders.length === 0 ? (
            <div className="text-center py-12 text-emerald-400 bg-emerald-900/30 rounded-lg border-2 border-dashed border-emerald-800/50 backdrop-blur-sm">
              Nenhum pedido em aberto no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={updateOrderStatus}
                  updating={updating === order.id}
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
            <div className="text-center py-12 text-emerald-400 bg-emerald-900/30 rounded-lg border-2 border-dashed border-emerald-800/50 backdrop-blur-sm">
              Nenhum pedido finalizado ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={updateOrderStatus}
                  updating={updating === order.id}
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

function OrderCard({ order, onStatusUpdate, updating, isCompleted = false }) {
  const nextStatus = getNextStatus(order.status)
  const product = order.produtos_teste

  const getStatusColor = (status) => {
    const colorMap = {
      'validado': 'text-green-400 bg-green-900/30 border-green-800/50',
      'em_preparo': 'text-orange-400 bg-orange-900/30 border-orange-800/50',
      'retira': 'text-blue-400 bg-blue-900/30 border-blue-800/50'
    }
    return colorMap[status] || 'text-gray-400 bg-gray-900/30 border-gray-800/50'
  }

  return (
    <div className={`bg-emerald-900/30 border border-emerald-800/30 rounded-2xl p-6 backdrop-blur-sm hover:translate-y-[-2px] transition-all ${
      isCompleted ? 'opacity-70' : ''
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-emerald-50">Pedido #{order.id.slice(-6)}</h3>
          <p className="text-sm text-emerald-400">
            {new Date(order.order_date).toLocaleString('pt-BR')}
          </p>
        </div>
        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          {getStatusText(order.status)}
        </span>
      </div>

      {/* Informações do Cliente */}
      {(order.user_name || order.user_ra) && (
        <div className="mb-4 p-3 bg-emerald-950/50 rounded-lg border border-emerald-800/30">
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <User size={14} className="text-emerald-400" />
            <div>
              <span className="font-medium">{order.user_name || 'Cliente'}</span>
              {order.user_ra && (
                <span className="text-emerald-400 ml-2">(RA: {order.user_ra})</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Produto */}
      <div className="flex gap-3 mb-4 pb-4 border-b border-emerald-800/30">
        {product?.image_url && (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <h4 className="font-medium text-emerald-50">{product?.name || 'Produto não encontrado'}</h4>
          <div className="flex gap-3 text-sm text-emerald-400 mt-1">
            <span>Qtd: {order.quantity}</span>
            <span>Un: {fmtMoney(order.unit_price)}</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="text-right mb-4">
        <span className="font-semibold text-emerald-50">
          Total: {fmtMoney(order.total_price)}
        </span>
      </div>

      {/* Ações */}
      {!isCompleted && (
        <button
          onClick={() => onStatusUpdate(order.id, nextStatus)}
          disabled={updating || !nextStatus}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all active:scale-95"
        >
          {updating ? (
            'Atualizando...'
          ) : (
            <>
              {getStatusIcon(nextStatus)}
              Avançar para {getStatusText(nextStatus)}
            </>
          )}
        </button>
      )}

      {/* Timeline */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-emerald-800/30">
        {['validado', 'em_preparo', 'retira'].map((status, index) => (
          <div key={status} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              order.status === status 
                ? 'bg-emerald-500 text-white' 
                : index < ['validado', 'em_preparo', 'retira'].indexOf(order.status)
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-900/50 text-emerald-400'
            }`}>
              {getStatusIcon(status)}
            </div>
            <span className="text-xs mt-1 text-emerald-400">{getStatusText(status)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Funções auxiliares para o OrderCard
function getNextStatus(currentStatus) {
  const statusFlow = {
    'validado': 'em_preparo',
    'em_preparo': 'retira', 
    'retira': null
  }
  return statusFlow[currentStatus]
}

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
    'validado': <CheckCircle size={14} />,
    'em_preparo': <Package size={14} />,
    'retira': <Truck size={14} />
  }
  return iconMap[status] || <Clock size={14} />
}