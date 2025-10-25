"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, ShoppingCart, Home, Clock, Calendar, Plus, Check, Tag } from "lucide-react"
import supabase from '../../lib/supabaseClient' // Ajuste o caminho conforme necessário

function fmtMoney(n) {
  if (n === null || n === undefined) return "—"
  const num = Number(n)
  if (Number.isNaN(num)) return "—"
  return `R$ ${num.toFixed(2).replace(".", ",")}`
}

function isPromotionActive(startsAt, endsAt) {
  const now = new Date()
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  return now >= start && now <= end
}

function isPromotionExpired(endsAt) {
  const now = new Date()
  const end = new Date(endsAt)
  return now > end
}

function getTimeRemaining(endsAt) {
  const end = new Date(endsAt)
  const now = new Date()
  const diff = end - now

  if (diff <= 0) return "Expirada"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h restantes`
  if (hours > 0) return `${hours}h restantes`
  return "Últimas horas!"
}

function getPromotionEmoji(startsAt, endsAt) {
  if (isPromotionExpired(endsAt)) return "❌"
  if (!isPromotionActive(startsAt, endsAt)) return "📅"

  const end = new Date(endsAt)
  const now = new Date()
  const diffHours = (end - now) / (1000 * 60 * 60)

  if (diffHours < 24) return "🔥"
  if (diffHours < 72) return "⚡"
  return "🎯"
}

export default function OffersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [cartItems, setCartItems] = useState({})
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Buscar promoções do Supabase
  useEffect(() => {
    async function fetchPromotions() {
      try {
        setLoading(true)
        setError(null)

        // Busca as promoções com join na tabela products para pegar as informações completas
        const { data, error } = await supabase
          .from('product_prices')
          .select(`
            *,
            products (
              id,
              name,
              image_url,
              description,
              nutrition
            )
          `)
          .order('starts_at', { ascending: false })

        if (error) {
          console.error('Erro ao buscar promoções:', error)
          setError('Erro ao carregar promoções')
          return
        }

        // Transforma os dados para o formato esperado pelo componente
        const formattedPromotions = data.map(item => ({
          id: item.id,
          name: item.name || item.products?.name || 'Produto sem nome',
          price: item.price,
          original_price: item.original_price, // Se você tiver essa coluna
          image: item.products?.image_url || '/placeholder.svg',
          starts_at: item.starts_at,
          ends_at: item.ends_at,
          nutrition: item.products?.nutrition || { 
            Calorias: "Informação não disponível", 
            Proteínas: "Informação não disponível", 
            Carboidratos: "Informação não disponível" 
          },
          product_id: item.product_id,
          // Adiciona informações extras se necessário
          description: item.products?.description
        }))

        setPromotions(formattedPromotions)
      } catch (error) {
        console.error('Erro:', error)
        setError('Erro ao carregar promoções')
      } finally {
        setLoading(false)
      }
    }

    fetchPromotions()
  }, [])

  const filteredPromotions = useMemo(() => {
    if (!searchTerm.trim()) return promotions

    const term = searchTerm.toLowerCase()
    return promotions.filter((promo) => 
      promo.name.toLowerCase().includes(term)
    )
  }, [searchTerm, promotions])

  const addToCart = (promo) => {
    if (isPromotionExpired(promo.ends_at)) return

    setCartItems((prev) => ({
      ...prev,
      [promo.id]: { 
        ...promo, 
        quantity: 1,
        is_promotion: true // Marca como item de promoção
      },
    }))

    setTimeout(() => {
      setCartItems((prev) => {
        const newItems = { ...prev }
        delete newItems[promo.id]
        return newItems
      })
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 flex items-center justify-center">
        <div className="text-emerald-400 text-lg">Carregando ofertas...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 flex items-center justify-center">
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-emerald-950/95 backdrop-blur-md border-b border-emerald-800/30 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Tag className="text-emerald-400" size={28} />
          <h1 className="text-2xl font-bold text-white">Ofertas Especiais</h1>
          <span className="bg-emerald-500 text-white px-2 py-1 rounded-full text-sm">
            {promotions.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />
          <input
            type="text"
            placeholder="Buscar ofertas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-emerald-950/50 border border-emerald-800/50 rounded-xl text-white placeholder-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Offers Grid */}
      <div className="p-4 space-y-4">
        {filteredPromotions.length === 0 ? (
          <div className="text-center text-emerald-400 py-12">
            {searchTerm ? "Nenhuma oferta encontrada" : "Nenhuma oferta disponível no momento"}
          </div>
        ) : (
          filteredPromotions.map((promo) => {
            const isActive = isPromotionActive(promo.starts_at, promo.ends_at)
            const isExpired = isPromotionExpired(promo.ends_at)
            const timeRemaining = getTimeRemaining(promo.ends_at)
            const emoji = getPromotionEmoji(promo.starts_at, promo.ends_at)
            const isInCart = cartItems[promo.id]

            return (
              <div
                key={promo.id}
                className={`bg-emerald-900/30 backdrop-blur-sm border rounded-2xl overflow-hidden ${
                  isExpired
                    ? "border-red-800/30 opacity-60"
                    : isActive
                      ? "border-emerald-500/30"
                      : "border-emerald-800/30"
                }`}
              >
                {/* Status Badge */}
                <div
                  className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${
                    isExpired
                      ? "bg-red-900/30 text-red-400"
                      : isActive
                        ? "bg-emerald-900/50 text-emerald-400"
                        : "bg-blue-900/30 text-blue-400"
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{isExpired ? "EXPIRADA" : isActive ? "PROMOÇÃO ATIVA!" : "EM BREVE"}</span>
                </div>

                <div className="p-4">
                  {/* Image and Info */}
                  <div className="flex gap-4 mb-4">
                    <img
                      src={promo.image || "/placeholder.svg"}
                      alt={promo.name}
                      className="w-24 h-24 object-cover rounded-xl"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg"
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">{promo.name}</h3>
                      <div className="text-2xl font-bold text-emerald-400 mb-1">
                        {fmtMoney(promo.price)}
                      </div>
                      {promo.original_price && promo.original_price > promo.price && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400 line-through">
                            {fmtMoney(promo.original_price)}
                          </span>
                          <span className="inline-block px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded">
                            {Math.round((1 - promo.price / promo.original_price) * 100)}% OFF
                          </span>
                        </div>
                      )}
                      {isActive && !isExpired && (
                        <span className="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded mt-1">
                          MELHOR PREÇO!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Period Info */}
                  <div className="space-y-2 mb-4 text-sm text-emerald-300">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>Início: {new Date(promo.starts_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>Fim: {new Date(promo.ends_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className={`font-semibold ${isExpired ? "text-red-400" : "text-emerald-400"}`}>
                      {timeRemaining}
                    </div>
                  </div>

                  {/* Nutrition */}
                  {promo.nutrition && (
                    <div className="mb-4 p-3 bg-emerald-950/50 rounded-lg">
                      <h4 className="text-sm font-semibold text-emerald-300 mb-2">Informações Nutricionais:</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs text-emerald-400">
                        {Object.entries(promo.nutrition).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-semibold">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {promo.description && (
                    <div className="mb-4 p-3 bg-emerald-950/30 rounded-lg">
                      <p className="text-sm text-emerald-300">{promo.description}</p>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => addToCart(promo)}
                    disabled={isExpired || !isActive}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                      isInCart
                        ? "bg-emerald-600 text-white"
                        : isExpired
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : !isActive
                            ? "bg-blue-900/30 text-blue-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    {isInCart ? (
                      <>
                        <Check size={16} />
                        Adicionado!
                      </>
                    ) : isExpired ? (
                      <>
                        <Clock size={16} />
                        Oferta Expirada
                      </>
                    ) : !isActive ? (
                      <>
                        <Calendar size={16} />
                        Em Breve
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Adicionar ao Carrinho
                      </>
                    )}
                  </button>

                  {isExpired && (
                    <p className="text-center text-xs text-red-400 mt-2">
                      Esta oferta expirou e não está mais disponível
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Sticky Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-emerald-950/95 backdrop-blur-md border-t border-emerald-800/30 p-4 flex gap-3">
        <a
          href="/app/alunos/home"
          className="flex-1 bg-emerald-900/50 hover:bg-emerald-800/50 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Home size={20} />
          Produtos
        </a>
        <a
          href="/carrinho"
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <ShoppingCart size={20} />
          Carrinho
        </a>
      </div>
    </div>
  )
}