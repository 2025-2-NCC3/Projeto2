// src/pages/Products/ProductsList.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import {
  Search, RefreshCw, PlusCircle, BadgePercent, Package,
  TrendingUp, ChevronRight, Edit3, Minus, Plus
} from 'lucide-react'
import supabase from '../../lib/supabaseClient'
import { useNotifier } from '../../components/Notifier/useNotifier'
import './ProductsList.css'

function fmtMoney(n) {
  if (n === null || n === undefined) return '—'
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `R$ ${num.toFixed(2).replace('.', ',')}`
}
function todayStr() { return new Date().toISOString().slice(0, 10) }
function daysAgoStr(days) {
  const d = new Date(); d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export default function ProductsList() {
  const { notify, NotifierHost } = useNotifier()
  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!q.trim()) return items
    const s = q.toLowerCase()
    return items.filter(
      p => (p.name || '').toLowerCase().includes(s) || (p.slug || '').toLowerCase().includes(s)
    )
  }, [items, q])

// --- Pedaço dentro da função load() ---
async function load() {
  setLoading(true)
  try {
    // 1) Produtos + preço (vindo da VIEW pública)
    const { data: prods, error: e1, status: s1 } = await supabase
      .from('products_public')         // <<< use a VIEW, não a tabela products
      .select('id, name, slug, image_url, price')  // price já vem junto
      .order('name', { ascending: true })

    if (e1) {
      console.error('[LIST products_public] status=', s1, 'error=', e1)
      throw e1
    }
    const ids = prods?.map(p => p.id) || []
    if (!ids.length) { setItems([]); setLoading(false); return }

    // 2) vendidos hoje
    const { data: soldToday, error: e3, status: s3 } = await supabase
      .from('sales_daily')
      .select('product_id, qty_sold')
      .eq('day', todayStr())
      .in('product_id', ids)
    if (e3) { console.error('[SOLD TODAY] status=', s3, e3); throw e3 }
    const todayMap = new Map(soldToday.map(r => [r.product_id, Number(r.qty_sold)]))

    // 3) vendidos 7d
    const { data: sold7, error: e4, status: s4 } = await supabase
      .from('sales_daily')
      .select('product_id, qty_sold, day')
      .gte('day', daysAgoStr(6))
      .lte('day', todayStr())
      .in('product_id', ids)
    if (e4) { console.error('[SOLD 7D] status=', s4, e4); throw e4 }
    const agg7 = new Map()
    for (const r of sold7) agg7.set(r.product_id, (agg7.get(r.product_id) || 0) + Number(r.qty_sold))

    // 4) estoque atual (opcional: se quiser exibir)
    const { data: stocks, error: e5, status: s5 } = await supabase
      .from('products')                 // isto requer SELECT permitido (veja SQL abaixo)
      .select('id, stock_qty')
      .in('id', ids)
    if (e5) { console.error('[STOCK] status=', s5, e5); throw e5 }
    const stockMap = new Map(stocks.map(r => [r.id, Number(r.stock_qty)]))

    setItems(prods.map(p => ({
      ...p,
      stock_qty: stockMap.get(p.id) ?? 0,
      soldToday: todayMap.get(p.id) || 0,
      sold7d: agg7.get(p.id) || 0,
    })))
  } catch (err) {
    notify({ type: 'error', title: 'Falha ao carregar', message: String(err?.message || err) })
  } finally {
    setLoading(false)
  }
}


  // 🔒 só carrega quando a sessão existir + reage a login/logout
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) load()
      else setLoading(false) // RequireAuth deve redirecionar
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session) load()
      else { setItems([]); setLoading(false) }
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  async function refresh() { setReloading(true); await load(); setReloading(false) }

  async function adjustStock(productId, delta) {
    try {
      const curr = items.find(i => i.id === productId)
      const newQty = Math.max(0, (curr?.stock_qty || 0) + delta)
      const { error, status } = await supabase
        .from('products')
        .update({ stock_qty: newQty })
        .eq('id', productId)
      if (error) {
        console.error('[UPDATE STOCK] status=', status, error)
        throw error
      }
      setItems(prev => prev.map(i => i.id === productId ? { ...i, stock_qty: newQty } : i))
      notify({ type: 'success', title: 'Estoque atualizado', message: `Novo estoque: ${newQty}` })
    } catch (err) {
      notify({ type: 'error', title: 'Erro no estoque', message: String(err?.message || err) })
    }
  }

  // ===== Promoção =====
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoProd, setPromoProd] = useState(null)
  const [promoPrice, setPromoPrice] = useState('')
  const [promoEndsAt, setPromoEndsAt] = useState('')

  function openPromo(p) { setPromoProd(p); setPromoPrice(String(p.price || '')); setPromoEndsAt(''); setPromoOpen(true) }
  function closePromo() { setPromoOpen(false); setPromoProd(null) }

  async function savePromo(e) {
    e.preventDefault()
    if (!promoProd) return
    const priceNumber = Number(String(promoPrice).replace(',', '.'))
    if (!priceNumber || priceNumber <= 0) {
      notify({ type: 'error', title: 'Preço inválido', message: 'Informe um valor válido.' })
      return
    }
    try {
      const payload = { product_id: promoProd.id, price: priceNumber }
      if (promoEndsAt) payload.ends_at = new Date(`${promoEndsAt}T23:59:59`).toISOString()

      const { error, status } = await supabase.from('product_prices').insert(payload)
      if (error) { console.error('[PROMO] status=', status, error); throw error }

      setItems(prev => prev.map(i => i.id === promoProd.id ? { ...i, price: priceNumber } : i))
      notify({ type: 'success', title: 'Promoção lançada', message: 'Preço atualizado com sucesso.' })
      closePromo()
    } catch (err) {
      notify({ type: 'error', title: 'Erro na promoção', message: String(err?.message || err) })
    }
  }

  return (
    <div className="plist-page">
      <NotifierHost />

      <div className="plist-topbar">
        <div className="plist-title"><Package /> <h1>Produtos</h1></div>
        <div className="plist-actions">
          <Link className="btn-primary" to="/app/produtos/novo"><PlusCircle size={16} /> Novo produto</Link>
          <button className="btn-outline" onClick={refresh} disabled={reloading}>
            <RefreshCw size={16} className={reloading ? 'spin' : ''} /> Atualizar
          </button>
        </div>
      </div>

      <div className="plist-toolbar">
        <div className="input-search">
          <Search size={16} />
          <input placeholder="Buscar por nome ou slug…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="plist-loading">Carregando…</div>
      ) : filtered.length === 0 ? (
        <div className="plist-empty">
          <p>Nenhum produto encontrado.</p>
          <Link to="/app/produtos/novo" className="btn-primary"><PlusCircle size={16} /> Cadastrar produto</Link>
        </div>
      ) : (
        <div className="plist-grid">
          {filtered.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }} className={`plist-card ${p.is_active ? '' : 'is-off'}`}>
              <div className="plist-thumb">
                {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="thumb-ph">sem imagem</div>}
              </div>

              <div className="plist-info">
                <div className="plist-name">{p.name}</div>
                <div className="plist-meta">
                  <span className="pill">{p.slug}</span>
                  <span className="pill">{fmtMoney(p.price)}</span>
                </div>

                <div className="plist-kpis">
                  <div className="kpi">
                    <span className="kpi-label">Estoque</span>
                    <div className="kpi-value">
                      <button className="btn-qty" onClick={() => adjustStock(p.id, -1)}><Minus size={14} /></button>
                      <span className="qty">{p.stock_qty ?? '—'}</span>
                      <button className="btn-qty" onClick={() => adjustStock(p.id, +1)}><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="kpi">
                    <span className="kpi-label">Vendidos (hoje)</span>
                    <div className="kpi-value"><TrendingUp size={14} /> {p.soldToday}</div>
                  </div>
                  <div className="kpi">
                    <span className="kpi-label">Vendidos (7d)</span>
                    <div className="kpi-value"><TrendingUp size={14} /> {p.sold7d}</div>
                  </div>
                </div>
              </div>

              <div className="plist-ops">
                <button className="btn-link" onClick={() => openPromo(p)}><BadgePercent size={16} /> Promoção</button>
                <button className="btn-link" disabled><Edit3 size={16} /> Editar (em breve)</button>
                <button className="btn-link" disabled>Detalhes <ChevronRight size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {promoOpen && (
        <div className="modal-backdrop" onClick={closePromo}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><BadgePercent /> <h3>Lançar promoção</h3></div>
            <p className="modal-sub">Produto: <strong>{promoProd?.name}</strong></p>
            <form onSubmit={savePromo} className="modal-form">
              <label><span>Novo preço (R$)</span>
                <input inputMode="decimal" placeholder="ex.: 6.50" value={promoPrice} onChange={e => setPromoPrice(e.target.value)} />
              </label>
              <label><span>Termina em (opcional)</span>
                <input type="date" value={promoEndsAt} onChange={e => setPromoEndsAt(e.target.value)} />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={closePromo}>Cancelar</button>
                <button type="submit" className="btn-primary">Aplicar promoção</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
