// src/pages/Relatorios/Relatorios.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { format, parseISO, startOfDay, endOfDay, isValid } from "date-fns";
import { supabase } from "../../lib/supabaseClient";
import { downloadCSV, downloadXLSX } from "../../lib/sheets";

/* =========================
   BRAND
   ========================= */
const BRAND = {
  name: "Comedoria da Tia",
  logo: "/logo.png", // coloque em /public
};
const abs = (path) => {
  try {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  } catch {
    return path;
  }
};

/* =========================
   CARD
   ========================= */
const Card = ({ children }) => (
  <div
    className="rounded-lg p-6"
    style={{
      backgroundColor: "rgba(17, 24, 39, 0.85)",
      border: "1px solid rgba(255,255,255,0.1)",
    }}
  >
    {children}
  </div>
);

/* =========================
   CONFIG PLANILHAS
   ========================= */
const ENTITY_CONFIG = {
  produtos: {
    table: "produtos_teste",
    dateField: "created_at",
    categoryField: "category",
    filename: "produtos",
  },
  pedidos: {
    table: "pedidos_teste",
    dateField: "order_date",
    categoryField: null,
    statusField: "status",
    filename: "pedidos",
  },
  promocoes: {
    table: "promotions",
    dateField: "starts_at",
    categoryField: "category",
    filename: "promocoes",
  },
  caixa: {
    table: "cash_movements",
    dateField: "occurred_at",
    categoryField: "type",
    filename: "caixa",
  },
};

const PEDIDOS_STATUS_OPTIONS = ["validado", "em_preparo", "retira"];

/* =========================
   HELPERS (gráficos)
   ========================= */
function buildSalesByDay(orders) {
  const map = new Map();
  for (const o of orders) {
    const d = o.order_date ? new Date(o.order_date) : null;
    if (!d || !isValid(d)) continue;
    const key = d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + Number(o.total_price || 0));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, sum]) => ({
      diaISO: key,
      dia: key.split("-").reverse().join("/"),
      vendas: Number(sum.toFixed(2)),
    }));
}

function buildOrdersByHour(orders) {
  const counts = Array(24).fill(0);
  for (const o of orders) {
    const d = o.order_date ? new Date(o.order_date) : null;
    if (!d || !isValid(d)) continue;
    counts[d.getHours()] += 1;
  }
  return counts.map((c, hour) => ({
    horario: `${String(hour).padStart(2, "0")}h`,
    clientes: c,
  }));
}

function buildTopProducts(orders, productsById, topN = 5) {
  const map = new Map();
  for (const o of orders) {
    const pid = o.product_id || "sem_id";
    map.set(pid, (map.get(pid) || 0) + Number(o.quantity || 0));
  }
  return Array.from(map.entries())
    .map(([product_id, quantidade]) => {
      const prod = productsById.get(product_id);
      const nome = prod?.name || product_id || "Produto";
      return { produto: nome, quantidade };
    })
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, topN);
}

function buildCategoryDistribution(orders, productsById) {
  const map = new Map();
  let totalQty = 0;
  for (const o of orders) {
    const prod = productsById.get(o.product_id);
    const cat = (prod?.category || "Sem categoria").toString();
    const qty = Number(o.quantity || 0);
    map.set(cat, (map.get(cat) || 0) + qty);
    totalQty += qty;
  }
  const PALETTE = ["#22c55e", "#84cc16", "#10b981", "#14b8a6", "#3b82f6", "#a78bfa", "#f59e0b", "#ef4444"];
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([nome, qnt], i) => ({
      nome,
      valor: totalQty ? Math.round((qnt / totalQty) * 100) : 0,
      cor: PALETTE[i % PALETTE.length],
    }));
}

/* =========================
   BUSCA (planilhas)
   ========================= */
async function fetchEntityRows(entityKey, { startDate, endDate, category, status }) {
  const conf = ENTITY_CONFIG[entityKey];
  if (!conf) throw new Error("Entidade inválida");

  let query = supabase.from(conf.table).select("*");

  if (startDate && conf.dateField) {
    query = query.gte(conf.dateField, startOfDay(parseISO(startDate)).toISOString());
  }
  if (endDate && conf.dateField) {
    query = query.lte(conf.dateField, endOfDay(parseISO(endDate)).toISOString());
  }
  if (category && conf.categoryField) {
    query = query.eq(conf.categoryField, category);
  }
  if (status && conf.statusField) {
    query = query.eq(conf.statusField, status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/* =========================
   PRINT ENGINE (iframe invisível)
   ========================= */
function printHTML(html) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Falha ao criar documento de impressão.");
  }
  doc.open();
  doc.write(html);
  doc.close();

  const doPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }
  };

  // aguarda layout e recursos (logo) carregarem
  iframe.onload = () => setTimeout(doPrint, 150);
}

/* =========================
   UTIL: converte datasets do dashboard para linhas tabulares
   ========================= */
function datasetToRows(kind, data) {
  switch (kind) {
    case "vendas_diarias":
      return data.map((r) => ({ dia: r.dia, vendas: r.vendas }));
    case "horarios_pico":
      return data.map((r) => ({ horario: r.horario, pedidos: r.clientes }));
    case "top_produtos":
      return data.map((r) => ({ produto: r.produto, quantidade: r.quantidade }));
    case "categorias":
      return data.map((r) => ({ categoria: r.nome, percentual: r.valor }));
    default:
      return [];
  }
}

/* =========================
   SEÇÃO: PLANILHAS (Dashboard/Tabela)
   ========================= */
function PlanilhasSection({
  dashVendasDiarias,
  dashHorariosPico,
  dashTopProdutos,
  dashCategorias,
}) {
  const [source, setSource] = useState("dashboard"); // "dashboard" | "tabela"

  // ====== "tabela"
  const [entity, setEntity] = useState("produtos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const conf = ENTITY_CONFIG[entity];
  const showStatusFilter = Boolean(conf.statusField);

  // ====== "dashboard"
  const [dashKind, setDashKind] = useState("vendas_diarias");

  async function handleLoad() {
    setMessage("");
    setLoading(true);
    try {
      const data = await fetchEntityRows(entity, {
        startDate,
        endDate,
        category,
        status: statusFilter,
      });
      setRows(data);
      if (!data.length) setMessage("Nenhum registro encontrado para os filtros aplicados.");
    } catch (err) {
      console.error(err);
      setMessage(`Erro ao carregar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function getExportFilename() {
    const stamp = new Date().toISOString().slice(0, 10);
    if (source === "dashboard") {
      const map = {
        vendas_diarias: "dashboard-vendas-diarias",
        horarios_pico: "dashboard-horarios-pico",
        top_produtos: "dashboard-top-produtos",
        categorias: "dashboard-categorias",
      };
      return `${map[dashKind]}-${stamp}`;
    }
    return `${conf.filename}-${stamp}`;
  }

  function getRowsForExport() {
    if (source === "dashboard") {
      switch (dashKind) {
        case "vendas_diarias":
          return datasetToRows("vendas_diarias", dashVendasDiarias);
        case "horarios_pico":
          return datasetToRows("horarios_pico", dashHorariosPico);
        case "top_produtos":
          return datasetToRows("top_produtos", dashTopProdutos);
        case "categorias":
          return datasetToRows("categorias", dashCategorias);
        default:
          return [];
      }
    }
    return rows || [];
  }

  function handleDownloadCSV() {
    const data = getRowsForExport();
    if (!data?.length) return setMessage("Nada para exportar.");
    const stamp = new Date();
    const meta = [{
      __relatorio__: `${BRAND.name} — ${source === "dashboard" ? "DASHBOARD" : conf.filename.toUpperCase()}`,
      __gerado_em__: stamp.toLocaleString(),
    }];
    downloadCSV([...meta, ...data], `${getExportFilename()}.csv`);
  }

  function handleDownloadXLSX() {
    const data = getRowsForExport();
    if (!data?.length) return setMessage("Nada para exportar.");
    downloadXLSX(data, `${getExportFilename()}.xlsx`, source === "dashboard" ? "dashboard" : conf.filename);
  }

  function handlePrintPDF() {
    const data = getRowsForExport();
    if (!data?.length) return setMessage("Nada para exportar.");
    const stamp = new Date();
    const ts = stamp.toLocaleString();
    const cols = Object.keys(data[0] || {});
    const thead = cols.map((k) => `<th>${k}</th>`).join("");
    const tbody = data.map(r => `<tr>${cols.map(k => `<td>${r[k] ?? ""}</td>`).join("")}</tr>`).join("");

    const title =
      source === "dashboard"
        ? `Exportação (Dashboard - ${dashKind.replace("_", " ")})`
        : `Exportação (${conf.filename.toUpperCase()})`;

    const tags = [
      `<span class="tag"><strong>Fonte:</strong> ${source}</span>`,
      source === "dashboard"
        ? `<span class="tag"><strong>Conjunto:</strong> ${dashKind}</span>`
        : `<span class="tag"><strong>Tabela:</strong> ${conf.table}</span>`,
      `<span class="tag"><strong>Registros:</strong> ${data.length}</span>`,
    ];
    if (source === "tabela") {
      if (startDate) tags.push(`<span class="tag"><strong>Início:</strong> ${startDate}</span>`);
      if (endDate) tags.push(`<span class="tag"><strong>Fim:</strong> ${endDate}</span>`);
      if (ENTITY_CONFIG[entity].categoryField && category) tags.push(`<span class="tag"><strong>Categoria:</strong> ${category}</span>`);
      if (ENTITY_CONFIG[entity].statusField && statusFilter) tags.push(`<span class="tag"><strong>Status:</strong> ${statusFilter}</span>`);
    }

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${BRAND.name} — ${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root{
    --bg:#0b1220; --card:#0f172a; --border:rgba(255,255,255,.12);
    --text:#e5e7eb; --muted:#94a3b8;
  }
  body{ margin:0; background:linear-gradient(135deg,#0b1220,#0f172a 45%,#065f46 110%);
        color:var(--text); font:14px/1.5 ui-sans-serif,system-ui; }
  .wrap{ padding:28px; }
  .brand{ display:flex; align-items:center; gap:14px; margin-bottom:14px; }
  .brand img{ width:48px; height:48px; object-fit:contain; border-radius:10px; background:#08101f; }
  .brand h1{ margin:0; font-size:20px; }
  .meta{
    display:flex; flex-wrap:wrap; gap:10px; align-items:center;
    padding:10px 12px; border:1px solid var(--border); border-radius:12px;
    background:rgba(255,255,255,.04); margin-bottom:16px;
  }
  .tag{ padding:4px 8px; border:1px solid var(--border); border-radius:999px; background:rgba(255,255,255,.06) }
  table{ width:100%; border-collapse:collapse; }
  th,td{ border:1px solid var(--border); padding:8px 10px; text-align:left; }
  thead th{ background:rgba(255,255,255,.06); }
  .footer{ margin-top:12px; color:var(--muted); font-size:12px; }
  @media print {
    body{ background:#fff; color:#000; }
    .meta, .tag{ border-color:#ccc; background:#fff; }
    th,td{ border-color:#ddd; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="brand">
      <img src="${abs(BRAND.logo)}" alt="logo" />
      <div>
        <h1>${BRAND.name} — ${title}</h1>
        <div class="footer">Gerado em ${ts}</div>
      </div>
    </div>

    <div class="meta">
      ${tags.join("\n")}
    </div>

    <table>
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
    </table>

    <div class="footer">© ${new Date().getFullYear()} ${BRAND.name}</div>
  </div>
  <script>
    // garante que a impressão dispare após layout
    window.addEventListener('load', function(){
      setTimeout(function(){ window.focus(); window.print(); }, 150);
    });
  </script>
</body>
</html>`;

    // === impressão segura via iframe (sem popup) ===
    try {
      printHTML(html);
    } catch (e) {
      console.error(e);
      setMessage("Não foi possível abrir a visualização de impressão. Verifique se o navegador permite imprimir.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg p-6" style={{ backgroundColor: "rgba(17,24,39,.85)", border: "1px solid rgba(255,255,255,.1)" }}>
        <h2 className="text-xl md:text-2xl font-bold text-gray-100 mb-4">Planilhas (Exportação)</h2>

        {/* Fonte */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-300">Fonte dos dados:</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-md bg-gray-900/60 text-gray-100 border border-white/10 p-2"
          >
            <option value="dashboard">Dashboard (gráficos)</option>
            <option value="tabela">Tabela (consulta ao banco)</option>
          </select>

          {source === "dashboard" && (
            <>
              <span className="text-sm text-gray-300">Conjunto:</span>
              <select
                value={dashKind}
                onChange={(e) => setDashKind(e.target.value)}
                className="rounded-md bg-gray-900/60 text-gray-100 border border-white/10 p-2"
              >
                <option value="vendas_diarias">Vendas diárias</option>
                <option value="horarios_pico">Horários de pico</option>
                <option value="top_produtos">Top produtos</option>
                <option value="categorias">Distribuição por categoria</option>
              </select>
            </>
          )}
        </div>

        {/* Filtros – apenas para Tabela */}
        {source === "tabela" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="col-span-1">
              <label className="block text-sm text-gray-300 mb-1">Entidade</label>
              <select
                value={entity}
                onChange={(e) => { setEntity(e.target.value); setStatusFilter(""); }}
                className="w-full rounded-md bg-gray-900/60 text-gray-100 border border-white/10 p-2 min-w-0"
              >
                <option value="produtos">Produtos</option>
                <option value="pedidos">Pedidos</option>
                <option value="promocoes">Promoções</option>
                <option value="caixa">Caixa</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm text-gray-300 mb-1">Data inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md bg-gray-900/60 text-gray-100 border border-white/10 p-2 min-w-0"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm text-gray-300 mb-1">Data final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md bg-gray-900/60 text-gray-100 border border-white/10 p-2 min-w-0"
              />
            </div>

            {/* Categoria (quando aplicável) */}
            <div className={`col-span-1 ${ENTITY_CONFIG[entity].categoryField ? "" : "opacity-50 pointer-events-none"}`}>
              <label className="block text-sm text-gray-300 mb-1">
                Categoria {ENTITY_CONFIG[entity].categoryField ? "" : "(não aplicável)"}
              </label>
              <input
                type="text"
                placeholder="Ex.: Bebidas"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={!ENTITY_CONFIG[entity].categoryField}
                className="w-full rounded-md bg-gray-900/60 text-gray-100 border border-white/10 p-2 min-w-0"
              />
            </div>

            {/* Status (somente pedidos_teste) */}
            <div className={`col-span-1 ${showStatusFilter ? "" : "opacity-50 pointer-events-none"}`}>
              <label className="block text-sm text-gray-300 mb-1">
                Status {showStatusFilter ? "" : "(não aplicável)"}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={!showStatusFilter}
                className="w-full rounded-md bg-gray-900/60 text-gray-100 border border-white/10 p-2 min-w-0"
              >
                <option value="">Todos</option>
                {PEDIDOS_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <button
                onClick={handleLoad}
                className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 w-full"
                disabled={loading}
              >
                {loading ? "Carregando..." : "Carregar"}
              </button>
            </div>
          </div>
        )}

        {/* Botões Export */}
        <div className="mt-4 flex flex-wrap gap-2 justify-start">
          <button onClick={handleDownloadCSV} className="rounded-md bg-gray-700 hover:bg-gray-600 text-white px-4 py-2">CSV</button>
          <button onClick={handleDownloadXLSX} className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2">Excel</button>
          <button onClick={handlePrintPDF} className="rounded-md bg-teal-600 hover:bg-teal-700 text-white px-4 py-2">Exportar PDF / Imprimir</button>
        </div>

        {/* Mensagens */}
        {message && <div className="mt-4 text-sm text-gray-100">{message}</div>}

        {/* Pré-visualização */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            Pré-visualização{" "}
            {source === "dashboard"
              ? `(Dashboard: ${dashKind.replace("_", " ")})`
              : rows?.length
              ? `(${rows.length} registro${rows.length > 1 ? "s" : ""})`
              : ""}
          </h3>

          {source === "dashboard" ? (
            <div className="overflow-auto rounded-lg border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800/60">
                  <tr>
                    {(() => {
                      const data = getRowsForExport();
                      const cols = data[0] ? Object.keys(data[0]) : [];
                      return cols.map((k) => (
                        <th key={k} className="px-3 py-2 text-left text-gray-300 whitespace-nowrap">
                          {k}
                        </th>
                      ));
                    })()}
                  </tr>
                </thead>
                <tbody>
                  {getRowsForExport().slice(0, 50).map((r, i) => (
                    <tr key={i} className="odd:bg-gray-900/40 even:bg-gray-900/20">
                      {Object.keys(r).map((k) => (
                        <td key={k} className="px-3 py-2 text-gray-100 whitespace-nowrap">
                          {String(r[k] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !rows?.length ? (
            <p className="text-gray-400 text-sm">Carregue os dados para visualizar.</p>
          ) : (
            <div className="overflow-auto rounded-lg border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800/60">
                  <tr>
                    {Object.keys(rows[0]).slice(0, 12).map((k) => (
                      <th key={k} className="px-3 py-2 text-left text-gray-300 whitespace-nowrap">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="odd:bg-gray-900/40 even:bg-gray-900/20">
                      {Object.keys(rows[0]).slice(0, 12).map((k) => (
                        <td key={k} className="px-3 py-2 text-gray-100 whitespace-nowrap">
                          {(() => {
                            const v = r[k];
                            if (typeof v === "string" && /\d{4}-\d{2}-\d{2}T/.test(v)) {
                              try { return format(parseISO(v), "dd/MM/yyyy HH:mm"); } catch { return v; }
                            }
                            return v === null || v === undefined ? "" : String(v);
                          })()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   PÁGINA: Dashboard + Planilhas
   ========================= */
export default function DashboardCantinaComPlanilhas() {
  const [chartStart, setChartStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [chartEnd, setChartEnd] = useState(() => new Date().toISOString().slice(0, 10));

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [errorCharts, setErrorCharts] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoadingCharts(true);
      setErrorCharts("");
      try {
        let q = supabase
          .from("pedidos_teste")
          .select("id, product_id, quantity, total_price, order_date");
        if (chartStart) q = q.gte("order_date", startOfDay(parseISO(chartStart)).toISOString());
        if (chartEnd)   q = q.lte("order_date", endOfDay(parseISO(chartEnd)).toISOString());
        const { data: ordersData, error: ordersErr } = await q;
        if (ordersErr) throw ordersErr;

        const { data: productsData, error: prodErr } = await supabase
          .from("produtos_teste")
          .select("id, name, category");
        if (prodErr) throw prodErr;

        if (!active) return;
        setOrders(ordersData || []);
        setProducts(productsData || []);
      } catch (e) {
        console.error(e);
        if (!active) return;
        setErrorCharts(e.message || "Erro ao carregar gráficos");
      } finally {
        if (active) setLoadingCharts(false);
      }
    }
    load();
    return () => { active = false; };
  }, [chartStart, chartEnd]);

  const productsById = useMemo(() => {
    const m = new Map();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const vendasDiarias = useMemo(() => buildSalesByDay(orders), [orders]);
  const horariosPico = useMemo(() => buildOrdersByHour(orders), [orders]);
  const topProdutos = useMemo(() => buildTopProducts(orders, productsById, 5), [orders, productsById]);
  const categoriasGraf = useMemo(() => buildCategoryDistribution(orders, productsById), [orders, productsById]);

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: "linear-gradient(135deg, #111827, #059669, #10b981)" }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Relatórios & Planilhas</h1>
            <p className="text-gray-300">Métricas com dados reais + exportações</p>
          </div>
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Data inicial (gráficos)</label>
              <input type="date" value={chartStart} onChange={(e) => setChartStart(e.target.value)} className="rounded-md bg-gray-900/60 text-gray-100 border border-white/10 p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Data final (gráficos)</label>
              <input type="date" value={chartEnd} onChange={(e) => setChartEnd(e.target.value)} className="rounded-md bg-gray-900/60 text-gray-100 border border-white/10 p-2" />
            </div>
          </div>
        </div>

        {errorCharts && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 text-red-200 p-3">
            {errorCharts}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-100">Vendas Diárias</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={vendasDiarias}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="dia" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#e5e7eb" }}
                  formatter={(v) => [`R$ ${Number(v).toFixed(2)}`, "Vendas"]}
                />
                <Area type="monotone" dataKey="vendas" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
            {loadingCharts && <p className="text-xs text-gray-400 mt-2">Carregando dados reais…</p>}
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-100">Horários de Pico</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={horariosPico}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="horario" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#e5e7eb" }} formatter={(v) => [v, "Pedidos"]} />
                <Line type="monotone" dataKey="clientes" stroke="#22c55e" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
            {loadingCharts && <p className="text-xs text-gray-400 mt-2">Carregando dados reais…</p>}
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-100">Produtos Mais Vendidos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProdutos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="produto" type="category" stroke="#9ca3af" width={120} />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#e5e7eb" }} formatter={(v) => [v, "Unidades"]} />
                <Bar dataKey="quantidade" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-100">Distribuição por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoriasGraf}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, valor }) => `${nome}: ${valor}%`}
                  outerRadius={100}
                  dataKey="valor"
                >
                  {categoriasGraf.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#e5e7eb" }}
                  formatter={(v, _n, p) => [`${v}%`, p?.payload?.nome || "Categoria"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ===== SEÇÃO: PLANILHAS ===== */}
        <PlanilhasSection
          dashVendasDiarias={vendasDiarias}
          dashHorariosPico={horariosPico}
          dashTopProdutos={topProdutos}
          dashCategorias={categoriasGraf}
        />
      </div>
    </div>
  );
}
