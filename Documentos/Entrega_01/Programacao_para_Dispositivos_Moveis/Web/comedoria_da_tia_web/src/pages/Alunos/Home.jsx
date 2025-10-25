"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, ShoppingCart, BadgePercent, Plus, Settings } from "lucide-react"
import supabase from '../../lib/supabaseClient'
import { useNavigate } from "react-router-dom"

function fmtMoney(n) {
  if (n == null) return "—"
  const num = Number(n)
  if (Number.isNaN(num)) return "—"
  return `R$ ${num.toFixed(2).replace(".", ",")}`
}

export default function Home() {
  const navigate = useNavigate()
  const [q, setQ] = useState("")
  const [cartCount, setCartCount] = useState(0)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartItems, setCartItems] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Verificar autenticação e role do usuário
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const role = session.user.user_metadata?.role || 'user'
          setUserRole(role)
        }
      } catch (error) {
        console.error('Erro ao verificar auth:', error)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role || 'user'
        setUserRole(role)
      } else {
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Buscar produtos do Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name')

        if (error) {
          console.error('Erro ao buscar produtos:', error)
          return
        }

        setProducts(data || [])
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Função para adicionar item ao carrinho
  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id)
      
      if (existingItem) {
        // Se o item já existe, aumenta a quantidade
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        // Se é um novo item, adiciona ao carrinho
        return [...prevItems, { ...product, quantity: 1 }]
      }
    })
    
    setCartCount(prevCount => prevCount + 1)
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return products
    const s = q.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(s))
  }, [q, products])

  const isAdmin = userRole === 'admin'

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 flex items-center justify-center">
        <div className="text-emerald-400 text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 pb-32"> {/* Aumentei o padding bottom */}
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
            {filtered.map((p) => (
              <div
                key={p.id}
                className="flex flex-col rounded-2xl overflow-hidden bg-emerald-900/30 border border-emerald-800/30 backdrop-blur-sm hover:translate-y-[-2px] transition-transform"
              >
                <div className="w-full h-48 bg-emerald-950/50 flex items-center justify-center overflow-hidden">
                  <img 
                    src={p.image_url || "/placeholder.svg"} 
                    alt={p.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg"
                    }}
                  />
                </div>

                <div className="p-4 flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-emerald-50">{p.name}</h3>
                  <p className="text-xl font-semibold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                    {fmtMoney(p.cost_estimated)}
                  </p>

                  {p.description && (
                    <p className="text-sm text-emerald-300">{p.description}</p>
                  )}

                  {/* Botão Adicionar ao Carrinho */}
                  <button
                    onClick={() => addToCart(p)}
                    className="mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-95 transition-all"
                  >
                    <Plus size={18} />
                    Adicionar ao Carrinho
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Botão Fixo do Admin (apenas para admins) */}
      {isAdmin && (
        <div className="fixed bottom-32 right-4 z-50">
          <button
            onClick={() => navigate('/app/produtos')}
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-purple-500/40 active:scale-[0.97] transition-all shadow-lg"
            title="Painel Administrativo"
          >
            <Settings size={20} />
            Admin
          </button>
        </div>
      )}

      {/* Navegação Inferior */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex gap-3 p-4 bg-emerald-950/95 backdrop-blur-md border-t border-emerald-800/30">
        <button
          onClick={() => console.log('Carrinho:', cartItems)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-emerald-500/40 active:scale-[0.97] transition-all"
        >
          <ShoppingCart size={20} />
          Carrinho {cartCount > 0 && `(${cartCount})`}
        </button>
        
        <button 
          onClick={() => navigate('/app/alunos/ofertas')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-emerald-500/40 active:scale-[0.97] transition-all"
        >
          <BadgePercent size={20} />
          Ofertas
        </button>
      </div>
    </div>
  )
}