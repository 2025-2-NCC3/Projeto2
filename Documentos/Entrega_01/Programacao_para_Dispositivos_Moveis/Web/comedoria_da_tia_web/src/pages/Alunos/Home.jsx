import { useState, useMemo, useEffect } from "react"
import { Search, ShoppingCart, BadgePercent, Plus, ListOrdered } from "lucide-react"
import supabase from '../../lib/supabaseClient'
import { useNavigate } from "react-router-dom"
import { useCart } from '../../context/CartContext'

function fmtMoney(n) {
  if (n == null) return "—"
  const num = Number(n)
  if (Number.isNaN(num)) return "—"
  return `R$ ${num.toFixed(2).replace(".", ",")}`
}

export default function Home() {
  const navigate = useNavigate()
  const { addToCart, itemCount } = useCart()
  const [q, setQ] = useState("")
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Buscar produtos - SEMPRE da tabela principal e calcular localmente
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        
        // Buscar SEMPRE da tabela principal
        const { data, error } = await supabase
          .from('produtos_teste')
          .select('*')
          .order('name')
          
        if (error) {
          console.error('Erro ao buscar produtos:', error)
          return
        }
        
        // Calcular promoções ativas LOCALMENTE
        const productsWithActivePromo = data.map(product => {
          const startsAt = product.starts_at ? new Date(product.starts_at) : null
          const endsAt = product.ends_at ? new Date(product.ends_at) : null
          const now = new Date()
          
          const isPromoActive = product.has_promotion && 
                               product.promotion_price && 
                               startsAt && 
                               endsAt &&
                               now >= startsAt && 
                               now <= endsAt
          
          console.log(`Produto: ${product.name}`, {
            has_promotion: product.has_promotion,
            promotion_price: product.promotion_price,
            starts_at: product.starts_at,
            ends_at: product.ends_at,
            isPromoActive,
            now: now.toISOString()
          })
          
          return {
            ...product,
            current_price: isPromoActive ? product.promotion_price : product.price,
            is_promotion_active: isPromoActive,
            original_price: product.price // Garantir que original_price existe
          }
        })
        
        console.log('Produtos processados:', productsWithActivePromo)
        setProducts(productsWithActivePromo)
        
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Função para adicionar item ao carrinho usando o preço correto
  const handleAddToCart = (product) => {
    const finalPrice = product.is_promotion_active ? product.promotion_price : product.price
    
    addToCart({
      id: product.id,
      name: product.name,
      price: finalPrice,
      original_price: product.original_price || product.price,
      promotion_price: product.promotion_price,
      is_promotion_active: product.is_promotion_active,
      image_url: product.image_url,
      description: product.description
    })
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return products
    const s = q.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(s))
  }, [q, products])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 flex items-center justify-center">
        <div className="text-emerald-400 text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 pb-32">
      <header className="sticky top-0 z-40 bg-emerald-950/95 backdrop-blur-md border-b border-emerald-800/30">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-emerald-400 mb-4">Comedoria da Tia</h1>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />
            <input
              type="text"
              placeholder="Buscar produtos…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-emerald-800/50 bg-emerald-950/50 text-emerald-50 placeholder:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center text-emerald-400 mt-12">
            {products.length === 0 ? "Nenhum produto cadastrado." : "Nenhum produto encontrado."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((p) => {
              const isPromoActive = p.is_promotion_active
              const currentPrice = p.current_price || p.price
              const originalPrice = p.original_price || p.price

              // Calcular porcentagem de desconto
              const discountPercentage = isPromoActive && originalPrice > 0
                ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                : 0

              return (
                <div
                  key={p.id}
                  className="flex flex-col rounded-2xl overflow-hidden bg-emerald-900/30 border border-emerald-800/30 backdrop-blur-sm hover:translate-y-[-2px] transition-transform"
                >
                  <div className="w-full h-48 bg-emerald-950/50 flex items-center justify-center overflow-hidden relative">
                    <img 
                      src={p.image_url || "/placeholder.svg"} 
                      alt={p.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg"
                      }}
                    />
                    {isPromoActive && discountPercentage > 0 && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                        -{discountPercentage}%
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col gap-2">
                    <h3 className="text-lg font-bold text-emerald-50">{p.name}</h3>
                    
                    {/* Exibição de preço com promoção - SEMPRE mostrar original_price quando houver promoção */}
                    <div className="flex flex-col gap-1">
                      {isPromoActive ? (
                        <>
                          {/* Preço antigo riscado - SEMPRE mostrar */}
                          <span className="text-sm text-red-400 line-through">
                            {fmtMoney(originalPrice)}
                          </span>
                          
                          {/* Novo preço com destaque */}
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-emerald-300">
                              {fmtMoney(currentPrice)}
                            </span>
                            <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                              PROMO
                            </span>
                          </div>
                          
                          {/* Economia */}
                          <span className="text-xs text-emerald-400">
                            Economize {fmtMoney(originalPrice - currentPrice)}
                          </span>
                        </>
                      ) : (
                        // Sem promoção - mostrar apenas o preço normal
                        <span className="text-xl font-semibold text-emerald-300">
                          {fmtMoney(currentPrice)}
                        </span>
                      )}
                    </div>

                    {p.description && (
                      <p className="text-sm text-emerald-300">{p.description}</p>
                    )}

                    {/* Informações adicionais da promoção */}
                    {isPromoActive && p.ends_at && (
                      <p className="text-xs text-emerald-400">
                        🕒 Promoção válida até {new Date(p.ends_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}

                    {/* Botão Adicionar ao Carrinho */}
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-95 transition-all"
                    >
                      <Plus size={18} />
                      Adicionar ao Carrinho
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Navegação Inferior */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex gap-3 p-4 bg-emerald-950/95 backdrop-blur-md border-t border-emerald-800/30">
        <button
          onClick={() => navigate('/app/alunos/carrinho')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-emerald-500/40 active:scale-[0.97] transition-all"
        >
          <ShoppingCart size={20} />
          Carrinho {itemCount > 0 && `(${itemCount})`}
        </button>
        
        <button 
          onClick={() => navigate('/app/alunos/pedidos')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-emerald-500/40 active:scale-[0.97] transition-all"
        >
          <ListOrdered size={20} />
          Pedidos
        </button>
      </div>
    </div>
  )
}