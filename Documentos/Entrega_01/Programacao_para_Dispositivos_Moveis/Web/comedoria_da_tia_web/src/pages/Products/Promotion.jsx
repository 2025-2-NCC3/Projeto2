// src/pages/Products/Promotion.jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgePercent, ArrowLeft, PackageSearch, Coins, Info } from 'lucide-react'
import supabase from '../../lib/supabaseClient'
import { useNotifier } from '../../components/Notifier/useNotifier'
import './Promotion.css'
import PromotionSender from '../../components/PromotionSender/PromotionSender'

/* =====================================
   Utils
   ===================================== */
function fmtMoney(n) {
  if (n === null || n === undefined) return '—'
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `R$ ${num.toFixed(2).replace('.', ',')}`
}

function todayStr() {
  // formato yyyy-mm-dd para o <input type="date" min="...">
  return new Date().toISOString().slice(0, 10)
}

/* =====================================
   Component
   ===================================== */
export default function Promotion() {
  const { notify, NotifierHost } = useNotifier()
  const navigate = useNavigate()

  // loading inicial dos produtos
  const [loading, setLoading] = useState(true)

  // lista de produtos retornados do banco
  const [products, setProducts] = useState([])

  // texto de busca
  const [q, setQ] = useState('')

  // id do produto selecionado no <select>
  const [selectedId, setSelectedId] = useState('')

  // produto atualmente selecionado (obj completo)
  const [current, setCurrent] = useState(null)

  // histórico de preços desse produto
  const [history, setHistory] = useState([])

  // form de lançamento
  const [price, setPrice] = useState('')
  const [endsAt, setEndsAt] = useState('')

  // estado de submit da promoção
  const [saving, setSaving] = useState(false)

  /* =====================================
     Computado: filtro de busca
     ===================================== */
  const filtered = useMemo(() => {
    if (!q.trim()) return products
    const s = q.toLowerCase()
    return products.filter((p) => {
      const nm = (p.name || '').toLowerCase()
      const sg = (p.slug || '').toLowerCase()
      return nm.includes(s) || sg.includes(s)
    })
  }, [q, products])

  /* =====================================
     Carregar lista de produtos (APENAS 'products')
     ===================================== */
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id,name,slug,image_url,cost_estimated,is_active')
        .order('name', { ascending: true })

      if (error) {
        throw error
      }

      // normaliza: front espera campo price
      const mapped = (data ?? []).map((p) => ({
        ...p,
        price: p.cost_estimated,
      }))

      setProducts(mapped)
    } catch (err) {
      notify({
        type: 'error',
        title: 'Falha ao carregar produtos',
        message: String(err?.message || err),
      })
    } finally {
      setLoading(false)
    }
  }, [notify])

  /* =====================================
     Carregar histórico de preço daquele produto
     ===================================== */
  const loadHistory = useCallback(
    async (productId) => {
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
        notify({
          type: 'error',
          title: 'Falha ao carregar histórico',
          message: String(err?.message || err),
        })
      }
    },
    [notify]
  )

  /* =====================================
     Sempre que o usuário escolher outro produto:
     - define current
     - reseta campos de form
     - busca histórico daquele produto
     ===================================== */
  useEffect(() => {
    const p = products.find((x) => String(x.id) === String(selectedId)) || null

    setCurrent(p)
    setPrice(p ? String(p.price ?? '') : '')
    setEndsAt('')

    loadHistory(p ? p.id : null)
  }, [selectedId, products, loadHistory])

  /* =====================================
     Carrega produtos quando houver sessão
     e reage a mudanças de auth
     ===================================== */
  useEffect(() => {
    let mounted = true

    // tenta sessão atual
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) {
        loadProducts()
      } else {
        // se não tem sessão, não tenta carregar
        setLoading(false)
      }
    })

    // escuta login/logout em tempo real
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session) {
        loadProducts()
      } else {
        // logout -> limpa lista
        setProducts([])
      }
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [loadProducts])

  /* =====================================
     Salvar promoção
     ===================================== */
  async function savePromotion(e) {
    e.preventDefault()

    if (!current) {
      notify({
        type: 'error',
        title: 'Selecione um produto',
        message: 'Escolha um produto para aplicar a promoção.',
      })
      return
    }

    // garante que estamos logados antes de tentar dar INSERT (ajuda a evitar 403)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      notify({
        type: 'error',
        title: 'Sessão expirada',
        message: 'Faça login novamente antes de aplicar promoção.',
      })
      return
    }

    // valida preço
    const priceNumber = Number(String(price).replace(',', '.'))
    if (!priceNumber || priceNumber <= 0) {
      notify({
        type: 'error',
        title: 'Preço inválido',
        message: 'Digite um valor numérico maior que zero.',
      })
      return
    }

    try {
      setSaving(true)

      // payload que vai pro Supabase
      const payload = {
        product_id: current.id,          // uuid do produto
        price: priceNumber,              // numeric(12,2)
        name: current.name ?? null,      // snapshot do nome
      }

      if (endsAt) {
        // fim opcional da promo, no final do dia
        payload.ends_at = new Date(`${endsAt}T23:59:59`).toISOString()
      }

      // INSERT na tabela de histórico/preços
      const { error: insertErr } = await supabase
        .from('product_prices')
        .insert(payload)

      if (insertErr) throw insertErr

      // atualiza o preço daquele produto na lista local (UX imediato)
      setProducts((prev) =>
        prev.map((p) =>
          String(p.id) === String(current.id)
            ? { ...p, price: priceNumber }
            : p
        )
      )

      notify({
        type: 'success',
        title: 'Promoção aplicada',
        message: 'Preço registrado com sucesso.',
      })

      // recarrega histórico visível
      loadHistory(current.id)
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro ao salvar',
        message: String(err?.message || err),
      })
    } finally {
      setSaving(false)
    }
  }

  /* =====================================
     Render
     ===================================== */
  return (
    <div className="prom-page">
      <NotifierHost />

      {/* Topbar */}
      <div className="prom-topbar">
        <div className="prom-title">
          <BadgePercent /> <h1>Promoções</h1>
        </div>

        <PromotionSender promotion={current}/>

        <div className="prom-actions">
          <Link className="btn-outline" to="/app/produtos">
            <ArrowLeft size={16} /> Voltar
          </Link>
        </div>
      </div>

      {/* Card principal */}
      <motion.div
        className="prom-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* GRID com seleção à esquerda e formulário à direita */}
        <div className="prom-grid">
          {/* Painel: seleção de produto */}
          <div className="prom-panel">
            <h3>Selecionar produto</h3>

            <div className="prom-search">
              <label>Buscar</label>
              <input
                className="prom-input"
                placeholder="Digite parte do nome ou slug…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="prom-field">
              <label>Produto</label>
              <select
                className="prom-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loading || products.length === 0}
              >
                <option value="">— Selecione —</option>
                {filtered.map((p) => (
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
                  <span className="pill">
                    <PackageSearch size={14} /> {current.slug}
                  </span>

                  <span className="pill">
                    <Coins size={14} /> {fmtMoney(current.price)}
                  </span>

                  {!current.is_active && (
                    <span className="pill">inativo</span>
                  )}
                </div>

                <small style={{ color: 'var(--muted)' }}>
                  Preço exibido vem diretamente de{' '}
                  <code>products.cost_estimated</code>.
                </small>
              </div>
            )}
          </div>

          {/* Painel: formulário de promoção */}
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
                  disabled={!current || saving}
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
                  disabled={!current || saving}
                />
              </div>
            </div>

            <div className="prom-actionsbar">
              <button
                type="button"
                className="btn-outline"
                onClick={() => navigate('/app/produtos')}
              >
                <ArrowLeft size={16} /> Cancelar
              </button>

              <button
                className="btn-primary"
                type="submit"
                disabled={!current || saving}
              >
                <BadgePercent size={16} />{' '}
                {saving ? 'Aplicando…' : 'Aplicar promoção'}
              </button>
            </div>

            <div className="prom-hint">
              <Info size={14} /> Ao aplicar, o preço é gravado em{' '}
              <code>product_prices</code>. O produto original não é alterado —
              garantindo o histórico completo.
            </div>
          </form>
        </div>

        {/* Painel: histórico de preços */}
        <div className="prom-panel">
          <h3>Histórico de preços</h3>

          {!current ? (
            <div style={{ color: 'var(--muted)' }}>
              Selecione um produto para visualizar o histórico.
            </div>
          ) : history.length === 0 ? (
            <div style={{ color: 'var(--muted)' }}>
              Nenhum registro recente de preço para este produto.
            </div>
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
                      <td>
                        {h.starts_at
                          ? new Date(h.starts_at).toLocaleString()
                          : '—'}
                      </td>
                      <td>
                        {h.ends_at
                          ? new Date(h.ends_at).toLocaleDateString()
                          : '—'}
                      </td>
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