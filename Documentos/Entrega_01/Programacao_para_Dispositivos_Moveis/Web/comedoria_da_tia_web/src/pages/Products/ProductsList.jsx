// src/pages/Products/ProductsList.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, RefreshCw, PlusCircle, BadgePercent, Package,
  TrendingUp, ChevronRight, Edit3, Minus, Plus, Tag, X, Calendar
} from 'lucide-react'
import supabase from '../../lib/supabaseClient'
import { useNotifier } from '../../components/Notifier/useNotifier'
import './ProductsList.css'

/* ------------------------------- utils ----------------------------------- */
function fmtMoney(n) {
  if (n === null || n === undefined) return '—'
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `R$ ${num.toFixed(2).replace('.', ',')}`
}
function todayStr() { return new Date().toISOString().slice(0, 10) }
function daysAgoStr(days) { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10) }
function startOfDayISO(dateStr) { return new Date(`${dateStr}T00:00:00`).toISOString() }
function endOfDayISO(dateStr) { return new Date(`${dateStr}T23:59:59.999`).toISOString() }

function isPromoActive(p) {
  if (!p?.has_promotion) return false
  if (!p?.promotion_price) return false
  const now = new Date()
  const starts = p?.starts_at ? new Date(p.starts_at) : null
  const ends = p?.ends_at ? new Date(p.ends_at) : null
  if (starts && now < starts) return false
  if (ends && now > ends) return false
  return true
}
function effectivePrice(p) {
  return isPromoActive(p) ? Number(p.promotion_price) : Number(p.price)
}

/* ------------------------------ Portal ------------------------------------ */
// Renderiza filhos no <body> (fora de qualquer stacking context)
function Portal({ children }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}

/* ---------------------------- scroll lock --------------------------------- */
function lockScroll(locked) {
  const body = document.body
  if (!body) return
  if (locked) {
    const y = window.scrollY || 0
    body.dataset._scrollY = String(y)
    body.style.position = 'fixed'
    body.style.top = `-${y}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
  } else {
    const y = Number(document.body.dataset._scrollY || 0)
    body.style.position = ''
    body.style.top = ''
    body.style.left = ''
    body.style.right = ''
    body.style.width = ''
    body.style.overflow = ''
    window.scrollTo(0, y)
    delete body.dataset._scrollY
  }
}

/* ================================ PAGE ==================================== */
export default function ProductsList() {
  const { notify, NotifierHost } = useNotifier()
  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [categories, setCategories] = useState([])

  const filtered = useMemo(() => {
    if (!q.trim()) return items
    const s = q.toLowerCase()
    return items.filter(
      p =>
        (p.name || '').toLowerCase().includes(s) ||
        (p.slug || '').toLowerCase().includes(s) ||
        (p.category || '').toLowerCase().includes(s)
    )
  }, [items, q])

  async function load() {
    setLoading(true)
    try {
      // produtos_teste
      const { data: prods, error: prodErr } = await supabase
        .from('produtos_teste')
        .select('id, name, slug, image_url, price, has_promotion, promotion_price, starts_at, ends_at, is_active, nutrition, stock_qty, category, description')
        .order('name', { ascending: true })
      if (prodErr) throw prodErr
      const products = prods ?? []
      const ids = products.map(p => p.id)

      // categorias
      const uniqCats = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()
      setCategories(uniqCats)

      if (!ids.length) { setItems([]); setLoading(false); return }

      // vendidos (hoje/7d) de pedidos_teste
      const today = todayStr()
      const d7 = daysAgoStr(6)
      const { data: soldRange, error: soldErr } = await supabase
        .from('pedidos_teste')
        .select('product_id, quantity, order_date')
        .gte('order_date', startOfDayISO(d7))
        .lte('order_date', endOfDayISO(today))
        .in('product_id', ids)
      if (soldErr) throw soldErr
      const range = soldRange ?? []

      const todayMap = new Map()
      const sevenMap = new Map()
      for (const r of range) {
        const pid = r.product_id
        const qty = Number(r.quantity || 0)
        const d = new Date(r.order_date)
        const isToday = d.toISOString().slice(0, 10) === today
        if (isToday) todayMap.set(pid, (todayMap.get(pid) || 0) + qty)
        sevenMap.set(pid, (sevenMap.get(pid) || 0) + qty)
      }

      setItems(products.map(p => ({
        ...p,
        price_eff: effectivePrice(p),
        soldToday: todayMap.get(p.id) || 0,
        sold7d: sevenMap.get(p.id) || 0,
      })))
    } catch (err) {
      notify({ type: 'error', title: 'Falha ao carregar', message: String(err?.message || err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) load()
      else setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session) load()
      else { setItems([]); setLoading(false) }
    })
    return () => { mounted = false; sub?.subscription?.unsubscribe?.() }
  }, [])

  async function refresh() { setReloading(true); await load(); setReloading(false) }

  async function adjustStock(productId, delta) {
    try {
      const curr = items.find(i => i.id === productId)
      const newQty = Math.max(0, (curr?.stock_qty || 0) + delta)
      const { error } = await supabase
        .from('produtos_teste')
        .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
        .eq('id', productId)
      if (error) throw error
      setItems(prev => prev.map(i => i.id === productId ? { ...i, stock_qty: newQty } : i))
      notify({ type: 'success', title: 'Estoque atualizado', message: `Novo estoque: ${newQty}` })
    } catch (err) {
      notify({ type: 'error', title: 'Erro no estoque', message: String(err?.message || err) })
    }
  }

  /* --------------------------- PROMO MODAL --------------------------- */
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoProd, setPromoProd] = useState(null)
  const [promoPrice, setPromoPrice] = useState('')
  const [promoEndsAt, setPromoEndsAt] = useState('')
  const promoFirstInputRef = useRef(null)

  function openPromo(p) {
    setPromoProd(p)
    setPromoPrice(String(isPromoActive(p) ? p.promotion_price : p.price || ''))
    setPromoEndsAt(p?.ends_at ? p.ends_at.slice(0, 10) : '')
    setPromoOpen(true)
  }
  function closePromo() { setPromoOpen(false); setPromoProd(null) }

  useEffect(() => {
    if (promoOpen) {
      lockScroll(true)
      setTimeout(() => promoFirstInputRef.current?.focus(), 0)
      const onKey = (e) => e.key === 'Escape' && closePromo()
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    } else { lockScroll(false) }
  }, [promoOpen])

  async function removePromo() {
    if (!promoProd) return
    try {
      const updates = {
        has_promotion: false, promotion_price: null,
        starts_at: null, ends_at: null, updated_at: new Date().toISOString()
      }
      const { error } = await supabase.from('produtos_teste').update(updates).eq('id', promoProd.id)
      if (error) throw error
      setItems(prev => prev.map(i => i.id === promoProd.id ? { ...i, ...updates, price_eff: i.price } : i))
      notify({ type: 'success', title: 'Promoção removida', message: 'Preço voltou ao normal.' })
      closePromo()
    } catch (err) {
      notify({ type: 'error', title: 'Erro ao remover promoção', message: String(err?.message || err) })
    }
  }

  async function savePromo(e) {
    e.preventDefault()
    if (!promoProd) return
    const priceNumber = Number(String(promoPrice).replace(',', '.'))
    if (!priceNumber || priceNumber <= 0) {
      notify({ type: 'error', title: 'Preço inválido', message: 'Informe um valor válido.' })
      return
    }
    try {
      const updates = {
        has_promotion: true,
        promotion_price: priceNumber,
        starts_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(promoEndsAt ? { ends_at: endOfDayISO(promoEndsAt) } : {})
      }
      const { error } = await supabase.from('produtos_teste').update(updates).eq('id', promoProd.id)
      if (error) throw error
      setItems(prev => prev.map(i => i.id === promoProd.id ? { ...i, ...updates, price_eff: priceNumber } : i))
      notify({ type: 'success', title: 'Promoção aplicada', message: 'Preço promocional ativado.' })
      closePromo()
    } catch (err) {
      notify({ type: 'error', title: 'Erro na promoção', message: String(err?.message || err) })
    }
  }

  /* ---------------------------- EDIT MODAL --------------------------- */
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editCategorySel, setEditCategorySel] = useState('')
  const [editCategoryNew, setEditCategoryNew] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [savingEdit, setSavingEdit] = useState(false)
  const editFirstInputRef = useRef(null)

  function openEdit(p) {
    setEditId(p.id)
    setEditName(p.name || '')
    setEditSlug(p.slug || '')
    setEditCategorySel(p.category || '')
    setEditCategoryNew('')
    setEditPrice(p.price != null ? String(p.price) : '')
    setEditDesc(p.description || '')
    setEditImageUrl(p.image_url || '')
    setEditActive(Boolean(p.is_active))
    setEditOpen(true)
  }
  function closeEdit() { setEditOpen(false); setEditId(null) }

  useEffect(() => {
    if (editOpen) {
      lockScroll(true)
      setTimeout(() => editFirstInputRef.current?.focus(), 0)
      const onKey = (e) => e.key === 'Escape' && closeEdit()
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    } else { lockScroll(false) }
  }, [editOpen])

  async function saveEdit(e) {
    e.preventDefault()
    if (!editId) return
    const priceNumber = Number(String(editPrice).replace(',', '.'))
    if (!editName.trim()) return notify({ type: 'error', title: 'Nome obrigatório', message: 'Informe o nome.' })
    if (!editSlug.trim()) return notify({ type: 'error', title: 'Slug obrigatório', message: 'Informe o slug.' })
    if (!priceNumber || priceNumber <= 0) return notify({ type: 'error', title: 'Preço inválido', message: 'Informe um preço válido.' })
    const finalCategory = (editCategoryNew || '').trim() || (editCategorySel || '').trim() || 'Outros'

    setSavingEdit(true)
    try {
      const updates = {
        name: editName.trim(),
        slug: editSlug.trim(),
        category: finalCategory,
        price: priceNumber,
        description: editDesc || null,
        image_url: editImageUrl || null,
        is_active: editActive,
        updated_at: new Date().toISOString()
      }
      const { error } = await supabase.from('produtos_teste').update(updates).eq('id', editId)
      if (error) throw error
      setItems(prev => prev.map(i => i.id === editId ? { ...i, ...updates, price_eff: effectivePrice({ ...i, ...updates }) } : i))
      if (editCategoryNew && !categories.includes(editCategoryNew.trim())) {
        setCategories(prev => [...prev, editCategoryNew.trim()].sort())
      }
      notify({ type: 'success', title: 'Produto atualizado', message: 'Dados salvos com sucesso.' })
      closeEdit()
    } catch (err) {
      notify({ type: 'error', title: 'Erro ao salvar', message: String(err?.message || err) })
    } finally { setSavingEdit(false) }
  }

  /* ============================== render ============================== */
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
          <input placeholder="Buscar por nome, slug ou categoria…" value={q} onChange={e => setQ(e.target.value)} />
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
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .25 }}
              className={`plist-card ${p.is_active ? '' : 'is-off'}`}
            >
              <div className="plist-thumb">
                {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="thumb-ph">sem imagem</div>}
              </div>

              <div className="plist-info">
                <div className="plist-name">{p.name}</div>
                <div className="plist-meta">
                  <span className="pill">{p.slug}</span>
                  <span className={`pill ${isPromoActive(p) ? 'pill-promo' : ''}`}>
                    {fmtMoney(effectivePrice(p))}
                  </span>
                  {isPromoActive(p) && <span className="pill strike">{fmtMoney(p.price)}</span>}
                  {p.category && <span className="pill"><Tag size={12} /> {p.category}</span>}
                </div>

                {p.nutrition && Object.keys(p.nutrition || {}).length > 0 && (
                  <div className="plist-nutrition">
                    <h4>Informações nutricionais:</h4>
                    <ul>
                      {Object.entries(p.nutrition).map(([key, value]) => (
                        <li key={key}><strong>{key}:</strong> {String(value)}</li>
                      ))}
                    </ul>
                  </div>
                )}

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
                <button className="btn-link" onClick={() => openEdit(p)}><Edit3 size={16} /> Editar</button>
                <button className="btn-link" disabled>Detalhes <ChevronRight size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* =================== MODAL PROMO (via Portal) =================== */}
      {promoOpen && (
        <Portal>
          <div className="modal-backdrop" onClick={closePromo}>
            <div className="modal-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <BadgePercent />
                <h3>Promoção</h3>
                <button className="btn-icon-close" onClick={closePromo}><X size={16} /></button>
              </div>

              <div className="promo-summary">
                <div><strong>Produto:</strong> <span>{promoProd?.name}</span></div>
                <div><strong>Preço atual:</strong> <span>{fmtMoney(promoProd ? effectivePrice(promoProd) : null)}</span></div>
                <div><strong>Status:</strong> <span>{promoProd && isPromoActive(promoProd) ? 'Ativa' : 'Inativa'}</span></div>
                {promoProd?.starts_at && (<div><strong>Início:</strong> <span>{new Date(promoProd.starts_at).toLocaleString()}</span></div>)}
                {promoProd?.ends_at && (<div><strong>Fim:</strong> <span>{new Date(promoProd.ends_at).toLocaleString()}</span></div>)}
              </div>

              <form onSubmit={savePromo} className="modal-form">
                <label><span>Novo preço (R$)</span>
                  <input
                    ref={promoFirstInputRef}
                    inputMode="decimal"
                    placeholder="ex.: 6.50"
                    value={promoPrice}
                    onChange={e => setPromoPrice(e.target.value)}
                  />
                </label>
                <label><span><Calendar size={14} /> Termina em (opcional)</span>
                  <input type="date" value={promoEndsAt} onChange={e => setPromoEndsAt(e.target.value)} />
                </label>
                <div className="modal-actions">
                  {promoProd && isPromoActive(promoProd) && (
                    <button type="button" className="btn-outline danger" onClick={removePromo}>Remover promoção</button>
                  )}
                  <button type="button" className="btn-outline" onClick={closePromo}>Cancelar</button>
                  <button type="submit" className="btn-primary">Aplicar</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* =================== MODAL EDIT (via Portal) ==================== */}
      {editOpen && (
        <Portal>
          <div className="modal-backdrop" onClick={closeEdit}>
            <div className="modal-card wide" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <Edit3 />
                <h3>Editar produto</h3>
                <button className="btn-icon-close" onClick={closeEdit}><X size={16} /></button>
              </div>

              <form onSubmit={saveEdit} className="modal-form form-grid">
                <label><span>Nome</span>
                  <input ref={editFirstInputRef} value={editName} onChange={e => setEditName(e.target.value)} />
                </label>
                <label><span>Slug</span>
                  <input value={editSlug} onChange={e => setEditSlug(e.target.value)} />
                </label>

                <label className="grid-span-2">
                  <span>Categoria</span>
                  <div className="cat-inline">
                    <select className="pnew-select" value={editCategorySel} onChange={e => setEditCategorySel(e.target.value)}>
                      <option value="">-- Selecionar existente --</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="pnew-or">ou</span>
                    <input className="pnew-input" placeholder="Criar nova (ex.: Salgados)" value={editCategoryNew} onChange={e => setEditCategoryNew(e.target.value)} />
                  </div>
                </label>

                <label>
                  <span>Preço (R$)</span>
                  <input inputMode="decimal" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                </label>

                <label>
                  <span>Imagem (URL)</span>
                  <input type="url" value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)} />
                </label>

                <label className="grid-span-2">
                  <span>Descrição</span>
                  <input value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                </label>

                <label className="switch">
                  <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} />
                  <span>Produto ativo</span>
                </label>

                <div className="modal-actions grid-span-2">
                  <button type="button" className="btn-outline" onClick={closeEdit}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={savingEdit}>
                    {savingEdit ? 'Salvando…' : 'Salvar alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
