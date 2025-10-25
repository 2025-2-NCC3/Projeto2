// src/pages/Products/Promotion.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgePercent, ArrowLeft, PackageSearch, Coins, Info } from 'lucide-react'
import supabase from '../../lib/supabaseClient'
import { useNotifier } from '../../components/Notifier/useNotifier'
import './Promotion.css'

function fmtMoney(n) {
  if (n === null || n === undefined) return '—'
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `R$ ${num.toFixed(2).replace('.', ',')}`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function Promotion() {
  const { notify, NotifierHost } = useNotifier()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [price, setPrice] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    if (!q.trim()) return products
    const s = q.toLowerCase()
    return products.filter(p =>
      (p.name || '').toLowerCase().includes(s) ||
      (p.slug || '').toLowerCase().includes(s)
    )
  }, [q, products])

  // 🔹 Carrega lista de produtos (da view ou tabela)
  async function loadProducts() {
    setLoading(true)
    try {
      let prods = []
      try {
        const { data, error } = await supabase
          .from('products_public')
          .select('id,name,slug,image_url,price,is_active')
          .order('name', { ascending: true })
        if (error) throw error
        prods = data ?? []
      } catch {
        const { data, error } = await supabase
          .from('products')
          .select('id,name,slug,image_url,cost_estimated,is_active')
          .order('name', { ascending: true })
        if (error) throw error
        prods = (data ?? []).map(p => ({ ...p, price: p.cost_estimated }))
      }
      setProducts(prods)
    } catch (err) {
      notify({ type: 'error', title: 'Falha ao carregar produtos', message: String(err?.message || err) })
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Carrega histórico de preços do produto
  async function loadHistory(productId) {
    setHistory([])
    if (!productId) return
    try {
      const { data, error } = await supabase
        .from('product_prices')
        .select('price, starts_at, ends_at')
        .eq('product_id', productId)
        .order('starts_at', { ascending: false })
        .limit(12)
      if (error) throw error
      setHistory(data ?? [])
    } catch (err) {
      notify({ type: 'error', title: 'Falha ao carregar histórico', message: String(err?.message || err) })
    }
  }

  // 🔹 Atualiza produto selecionado
  useEffect(() => {
    const p = products.find(x => x.id === selectedId) || null
    setCurrent(p)
    setPrice(p ? String(p.price ?? '') : '')
    setEndsAt('')
    loadHistory(selectedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // 🔹 Sessão e carregamento inicial
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) loadProducts()
      else setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return
      if (session) loadProducts()
      else setProducts([])
    })
    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  // 🔹 Salvar promoção (sem atualizar products)
  async function savePromotion(e) {
    e.preventDefault()
    if (!current) {
      notify({ type: 'error', title: 'Selecione um produto', message: 'Escolha um produto para aplicar a promoção.' })
      return
    }

    const priceNumber = Number(String(price).replace(',', '.'))
    if (!priceNumber || priceNumber <= 0) {
      notify({ type: 'error', title: 'Preço inválido', message: 'Digite um valor numérico maior que zero.' })
      return
    }

    try {
      setSaving(true)

      // 🟩 1) Inserir novo preço promocional
      const payload = { product_id: current.id, price: priceNumber, name: current.name  }
      if (endsAt) payload.ends_at = new Date(`${endsAt}T23:59:59`).toISOString()

      const { error: pErr } = await supabase.from('product_prices').insert(payload)
      if (pErr) throw pErr

      // 🟩 2) Atualizar apenas a UI local
      setProducts(prev =>
        prev.map(p => p.id === current.id ? { ...p, price: priceNumber } : p)
      )

      notify({ type: 'success', title: 'Promoção aplicada', message: 'Preço registrado com sucesso.' })
      loadHistory(current.id)
    } catch (err) {
      notify({ type: 'error', title: 'Erro ao salvar', message: String(err?.message || err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="prom-page">
      <NotifierHost />

      <div className="prom-topbar">
        <div className="prom-title">
          <BadgePercent /> <h1>Promoções</h1>
        </div>
        <div className="prom-actions">
          <Link className="btn-outline" to="/app/produtos">
            <ArrowLeft size={16} /> Voltar
          </Link>
        </div>
      </div>

      <motion.div
        className="prom-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .3 }}
      >
        {/* 🔹 Seleção e formulário */}
        <div className="prom-grid">
          <div className="prom-panel">
            <h3>Selecionar produto</h3>

            <div className="prom-search">
              <label>Buscar</label>
              <input
                className="prom-input"
                placeholder="Digite parte do nome ou slug…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="prom-field">
              <label>Produto</label>
              <select
                className="prom-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">— Selecione —</option>
                {filtered.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {fmtMoney(p.price)}
                  </option>
                ))}
              </select>
            </div>

            {current && (
              <div className="prom-panel" style={{ marginTop: 8 }}>
                <h3>Resumo atual</h3>
                <div className="prom-kv">
                  <span className="pill"><PackageSearch size={14} /> {current.slug}</span>
                  <span className="pill"><Coins size={14} /> {fmtMoney(current.price)}</span>
                  {current.is_active ? null : <span className="pill">inativo</span>}
                </div>
                <small style={{ color: 'var(--muted)' }}>
                  Preço exibido vem da view <code>products_public</code> ou de <code>products.cost_estimated</code> (fallback).
                </small>
              </div>
            )}
          </div>

          {/* 🔹 Formulário de promoção */}
          <form className="prom-panel" onSubmit={savePromotion}>
            <h3>Lançar promoção</h3>
            <div className="prom-row">
              <div className="prom-field">
                <label>Novo preço (R$)</label>
                <input
                  className="prom-input"
                  inputMode="decimal"
                  placeholder="ex.: 6.50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="prom-field">
                <label>Termina em (opcional)</label>
                <input
                  className="prom-input"
                  type="date"
                  min={todayStr()}
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>

            <div className="prom-actionsbar">
              <button type="button" className="btn-outline" onClick={() => navigate('/app/produtos')}>
                <ArrowLeft size={16} /> Cancelar
              </button>
              <button className="btn-primary" type="submit" disabled={!current || saving}>
                <BadgePercent size={16} /> {saving ? 'Aplicando…' : 'Aplicar promoção'}
              </button>
            </div>

            <div>
              <Info size={14} /> Ao aplicar, o preço é gravado em <code>product_prices</code>.  
              O produto original não é alterado — garantindo o histórico completo.
            </div>
          </form>
        </div>

        {/* 🔹 Histórico de preços */}
        <div className="prom-panel">
          <h3>Histórico de preços</h3>
          {(!current || history.length === 0) ? (
            <div style={{ color: 'var(--muted)' }}>Selecione um produto para visualizar o histórico.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Preço</th>
                    <th>Criado em</th>
                    <th>Termina em</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td>{fmtMoney(h.price)}</td>
                      <td>{new Date(h.starts_at).toLocaleString()}</td>
                      <td>{h.ends_at ? new Date(h.ends_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
