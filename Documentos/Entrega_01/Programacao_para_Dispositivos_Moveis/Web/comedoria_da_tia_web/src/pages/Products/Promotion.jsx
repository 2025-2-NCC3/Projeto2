// src/pages/Products/Promotion.jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgePercent, ArrowLeft, PackageSearch, Coins, Info, Calendar } from 'lucide-react'
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
  return new Date().toISOString().slice(0, 10)
}

function formatDateTimeLocal(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/* =====================================
   Component
   ===================================== */
export default function Promotion() {
  const { notify, NotifierHost } = useNotifier()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  
  // Novos campos para promoção
  const [hasPromotion, setHasPromotion] = useState(false)
  const [promotionPrice, setPromotionPrice] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  
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
     Carregar lista de produtos da tabela produtos_teste
     ===================================== */
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('produtos_teste')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        throw error
      }

      setProducts(data ?? [])
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
     Carregar histórico de promoções do produto
     ===================================== */
  const loadHistory = useCallback(
    async (productId) => {
      setHistory([])
      if (!productId) return
      try {
        // Buscar da própria tabela produtos_teste para ver promoções anteriores
        const { data, error } = await supabase
          .from('produtos_teste')
          .select('name, price, promotion_price, starts_at, ends_at, updated_at')
          .eq('id', productId)
          .single()

        if (error) throw error

        // Criar histórico baseado nas promoções atuais e anteriores
        const historyData = []
        
        // Preço normal atual
        historyData.push({
          price: data.price,
          type: 'normal',
          date: data.updated_at,
          description: 'Preço normal'
        })

        // Se tem promoção ativa
        if (data.has_promotion && data.promotion_price) {
          historyData.push({
            price: data.promotion_price,
            type: 'promotion',
            date: data.updated_at,
            description: 'Promoção atual',
            starts_at: data.starts_at,
            ends_at: data.ends_at
          })
        }

        setHistory(historyData)
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
     Quando selecionar um produto
     ===================================== */
  useEffect(() => {
    const p = products.find((x) => String(x.id) === String(selectedId)) || null

    setCurrent(p)
    
    if (p) {
      // Preencher formulário com dados atuais do produto
      setHasPromotion(p.has_promotion || false)
      setPromotionPrice(p.promotion_price ? String(p.promotion_price) : '')
      setStartsAt(p.starts_at ? formatDateTimeLocal(p.starts_at) : '')
      setEndsAt(p.ends_at ? formatDateTimeLocal(p.ends_at) : '')
    } else {
      // Resetar formulário se não há produto selecionado
      setHasPromotion(false)
      setPromotionPrice('')
      setStartsAt('')
      setEndsAt('')
    }

    loadHistory(p ? p.id : null)
  }, [selectedId, products, loadHistory])

  /* =====================================
     Carrega produtos quando houver sessão
     ===================================== */
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) {
        loadProducts()
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session) {
        loadProducts()
      } else {
        setProducts([])
      }
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [loadProducts])

  /* =====================================
     Validação das datas de promoção
     ===================================== */
  const validatePromotionDates = () => {
    if (!hasPromotion) return true

    if (!promotionPrice) {
      notify({
        type: 'error',
        title: 'Preço promocional obrigatório',
        message: 'Informe o preço promocional.',
      })
      return false
    }

    const promotionPriceNum = Number(String(promotionPrice).replace(',', '.'))
    if (!promotionPriceNum || promotionPriceNum <= 0) {
      notify({
        type: 'error',
        title: 'Preço promocional inválido',
        message: 'Digite um valor numérico maior que zero.',
      })
      return false
    }

    if (!startsAt || !endsAt) {
      notify({
        type: 'error',
        title: 'Datas obrigatórias',
        message: 'Informe data de início e fim da promoção.',
      })
      return false
    }

    const startDate = new Date(startsAt)
    const endDate = new Date(endsAt)
    const now = new Date()

    if (startDate >= endDate) {
      notify({
        type: 'error',
        title: 'Datas inválidas',
        message: 'A data final deve ser posterior à data inicial.',
      })
      return false
    }

    if (endDate <= now) {
      notify({
        type: 'error',
        title: 'Data final inválida',
        message: 'A data final deve ser futura.',
      })
      return false
    }

    return true
  }

  /* =====================================
     Salvar/Atualizar promoção
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

    // Validar promoção se estiver ativa
    if (hasPromotion && !validatePromotionDates()) {
      return
    }

    try {
      setSaving(true)

      // Preparar dados para atualização
      const updateData = {
        has_promotion: hasPromotion,
        promotion_price: hasPromotion ? Number(String(promotionPrice).replace(',', '.')) : null,
        starts_at: hasPromotion ? startsAt : null,
        ends_at: hasPromotion ? endsAt : null,
        updated_at: new Date().toISOString(),
      }

      // UPDATE na tabela produtos_teste
      const { error: updateErr } = await supabase
        .from('produtos_teste')
        .update(updateData)
        .eq('id', current.id)

      if (updateErr) throw updateErr

      // Atualizar a lista local
      setProducts((prev) =>
        prev.map((p) =>
          String(p.id) === String(current.id)
            ? { ...p, ...updateData }
            : p
        )
      )

      notify({
        type: 'success',
        title: hasPromotion ? 'Promoção aplicada' : 'Promoção removida',
        message: hasPromotion 
          ? `Promoção de ${fmtMoney(updateData.promotion_price)} aplicada com sucesso!`
          : 'Promoção removida do produto.',
      })

      // Recarregar histórico
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
     Remover promoção
     ===================================== */
  async function removePromotion() {
    if (!current) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('produtos_teste')
        .update({
          has_promotion: false,
          promotion_price: null,
          starts_at: null,
          ends_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id)

      if (error) throw error

      // Atualizar lista local
      setProducts((prev) =>
        prev.map((p) =>
          String(p.id) === String(current.id)
            ? { 
                ...p, 
                has_promotion: false,
                promotion_price: null,
                starts_at: null,
                ends_at: null 
              }
            : p
        )
      )

      // Resetar formulário
      setHasPromotion(false)
      setPromotionPrice('')
      setStartsAt('')
      setEndsAt('')

      notify({
        type: 'success',
        title: 'Promoção removida',
        message: 'Promoção removida com sucesso.',
      })

      loadHistory(current.id)
    } catch (err) {
      notify({
        type: 'error',
        title: 'Erro ao remover promoção',
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
                    {p.has_promotion && ' 🏷️ PROMO'}
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

                  {current.has_promotion && (
                    <span className="pill" style={{ background: '#dc2626', color: 'white' }}>
                      <BadgePercent size={14} /> {fmtMoney(current.promotion_price)}
                    </span>
                  )}

                  {!current.is_active && (
                    <span className="pill">inativo</span>
                  )}
                </div>

                <small style={{ color: 'var(--muted)' }}>
                  Sistema integrado com a tabela <code>produtos_teste</code>.
                </small>
              </div>
            )}
          </div>

          {/* Painel: formulário de promoção */}
          <form className="prom-panel" onSubmit={savePromotion}>
            <h3>Gerenciar Promoção</h3>

            {/* Checkbox para ativar/desativar promoção */}
            <div className="prom-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasPromotion}
                  onChange={(e) => setHasPromotion(e.target.checked)}
                  disabled={!current || saving}
                />
                <BadgePercent size={16} />
                <span>Ativar promoção para este produto</span>
              </label>
            </div>

            {hasPromotion && (
              <div className="prom-promotion-fields">
                <div className="prom-row">
                  <div className="prom-field">
                    <label>Preço promocional (R$)</label>
                    <input
                      className="prom-input"
                      inputMode="decimal"
                      placeholder="ex.: 6.50"
                      value={promotionPrice}
                      onChange={(e) => setPromotionPrice(e.target.value)}
                      disabled={!current || saving}
                    />
                  </div>
                </div>

                <div className="prom-row">
                  <div className="prom-field">
                    <label><Calendar size={14} /> Início da promoção</label>
                    <input
                      className="prom-input"
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      disabled={!current || saving}
                    />
                  </div>

                  <div className="prom-field">
                    <label><Calendar size={14} /> Fim da promoção</label>
                    <input
                      className="prom-input"
                      type="datetime-local"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      disabled={!current || saving}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="prom-actionsbar">
              <button
                type="button"
                className="btn-outline"
                onClick={() => navigate('/app/produtos')}
              >
                <ArrowLeft size={16} /> Cancelar
              </button>

              {current?.has_promotion && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={removePromotion}
                  disabled={!current || saving}
                >
                  <BadgePercent size={16} /> Remover Promoção
                </button>
              )}

              <button
                className="btn-primary"
                type="submit"
                disabled={!current || saving}
              >
                <BadgePercent size={16} />{' '}
                {saving ? 'Salvando…' : hasPromotion ? 'Aplicar Promoção' : 'Atualizar Produto'}
              </button>
            </div>

            <div className="prom-hint">
              <Info size={14} /> As promoções são gerenciadas diretamente na tabela{' '}
              <code>produtos_teste</code> com controle de datas de validade.
            </div>
          </form>
        </div>

        {/* Painel: histórico de preços */}
        <div className="prom-panel">
          <h3>Histórico de Preços</h3>

          {!current ? (
            <div style={{ color: 'var(--muted)' }}>
              Selecione um produto para visualizar o histórico.
            </div>
          ) : history.length === 0 ? (
            <div style={{ color: 'var(--muted)' }}>
              Nenhum registro de preço para este produto.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Preço</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Início</th>
                    <th>Término</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{fmtMoney(h.price)}</strong>
                      </td>
                      <td>
                        <span className={`pill ${h.type === 'promotion' ? 'promo-pill' : ''}`}>
                          {h.type === 'promotion' ? 'PROMO' : 'NORMAL'}
                        </span>
                      </td>
                      <td>{h.description}</td>
                      <td>
                        {h.starts_at
                          ? new Date(h.starts_at).toLocaleString('pt-BR')
                          : '—'}
                      </td>
                      <td>
                        {h.ends_at
                          ? new Date(h.ends_at).toLocaleString('pt-BR')
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