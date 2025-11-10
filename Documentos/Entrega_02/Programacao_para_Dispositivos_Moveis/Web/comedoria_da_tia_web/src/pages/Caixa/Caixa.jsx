"use client";

import { useEffect, useMemo, useState } from "react";
import supabase from "../../lib/supabaseClient"; // mesmo padrão do ProductsList.jsx
import { downloadCSV, downloadXLSX } from "../../lib/sheets";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import "./Caixa.css";

/** ======== Branding ======== */
const BRAND = {
  name: "Comedoria da Tia",
  logo: "/logo.png", // coloque em /public
};
/** URL absoluta p/ impressão */
const abs = (path) => {
  try {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  } catch {
    return path;
  }
};

/** ======== Domínio ======== */
const TURNOS = ["Todos", "Manhã", "Tarde", "Noite"];
const STATUS_OPS = ["validado", "em_preparo", "retira"];

/** Deriva o turno a partir da hora */
function turnoFromDate(d) {
  const h = d.getHours();
  if (h >= 6 && h < 12) return "Manhã";
  if (h >= 12 && h < 18) return "Tarde";
  return "Noite";
}

/** Impressão segura via iframe invisível */
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

  iframe.onload = () => setTimeout(() => {
    try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }
    finally { setTimeout(() => document.body.removeChild(iframe), 600); }
  }, 150);
}

export default function Caixa() {
  /** ======== Filtros ======== */
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [turno, setTurno] = useState("Todos");
  const [statusSel, setStatusSel] = useState("Todos");
  const [q, setQ] = useState(""); // busca por nome do produto/cliente/RA

  /** ======== Dados ======== */
  const [rows, setRows] = useState([]); // pedidos do dia
  const [productsMap, setProductsMap] = useState(new Map()); // id -> {name, category}
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /** Carrega pedidos do dia e mapa de produtos */
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setMsg("");
      try {
        // 1) Carrega pedidos_teste do dia
        let q = supabase
          .from("pedidos_teste")
          .select("id, product_id, quantity, unit_price, total_price, status, order_date, user_id, user_ra, user_name")
          .gte("order_date", startOfDay(parseISO(data)).toISOString())
          .lte("order_date", endOfDay(parseISO(data)).toISOString())
          .order("order_date", { ascending: true });
        const { data: pedidos, error: errPedidos } = await q;
        if (errPedidos) throw errPedidos;

        // 2) Carrega produtos necessários para nome/categoria
        const pids = Array.from(new Set((pedidos ?? []).map(p => p.product_id).filter(Boolean)));
        let pmap = new Map();
        if (pids.length) {
          const { data: prods, error: errProds } = await supabase
            .from("produtos_teste")
            .select("id, name, category")
            .in("id", pids);
          if (errProds) throw errProds;
          pmap = new Map((prods ?? []).map(p => [p.id, p]));
        }

        if (!active) return;
        setRows(pedidos ?? []);
        setProductsMap(pmap);
      } catch (e) {
        console.error(e);
        if (!active) return;
        setMsg(e?.message || "Erro ao carregar dados.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [data]);

  /** Linhas filtradas por turno, status e busca textual */
  const rowsFiltered = useMemo(() => {
    let list = rows;

    if (turno !== "Todos") {
      list = list.filter(r => {
        const d = new Date(r.order_date);
        return turnoFromDate(d) === turno;
      });
    }

    if (statusSel !== "Todos") {
      list = list.filter(r => r.status === statusSel);
    }

    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(r => {
        const prod = productsMap.get(r.product_id);
        const prodName = (prod?.name || "").toLowerCase();
        const userName = (r.user_name || "").toLowerCase();
        const userRa = (r.user_ra || "").toLowerCase();
        return prodName.includes(s) || userName.includes(s) || userRa.includes(s);
      });
    }

    return list;
  }, [rows, turno, statusSel, q, productsMap]);

  /** KPIs do caixa */
  const kpis = useMemo(() => {
    let entradasConfirmadas = 0;     // status: validado/retira
    let valorEmPreparo = 0;          // status: em_preparo
    let qtd = 0;

    for (const r of rowsFiltered) {
      qtd += 1;
      const v = Number(r.total_price || 0);
      if (r.status === "em_preparo") valorEmPreparo += v;
      else entradasConfirmadas += v; // validado + retira
    }
    return {
      entradas: entradasConfirmadas,
      pendente: valorEmPreparo,
      saldo: entradasConfirmadas, // sem saídas nesta tabela
      qtdPedidos: qtd,
    };
  }, [rowsFiltered]);

  /** Atualiza status inline */
  async function changeStatus(orderId, newStatus) {
    try {
      const { error } = await supabase
        .from("pedidos_teste")
        .update({ status: newStatus })
        .eq("id", orderId);
      if (error) throw error;
      setRows(prev => prev.map(r => r.id === orderId ? { ...r, status: newStatus } : r));
      setMsg("Status atualizado!");
      setTimeout(() => setMsg(""), 1200);
    } catch (e) {
      console.error(e);
      setMsg(e?.message || "Erro ao atualizar status.");
      setTimeout(() => setMsg(""), 1800);
    }
  }

  /** Exportações */
  function baseExportRows() {
    return rowsFiltered.map(r => {
      const d = new Date(r.order_date);
      const prod = productsMap.get(r.product_id);
      return {
        id: r.id,
        data: d.toISOString().slice(0, 10),
        hora: format(d, "HH:mm"),
        turno: turnoFromDate(d),
        status: r.status,
        produto: prod?.name || r.product_id || "",
        categoria: prod?.category || "",
        quantidade: r.quantity,
        unit_price: Number(r.unit_price ?? 0),
        total_price: Number(r.total_price ?? 0),
        cliente: r.user_name || "",
        ra: r.user_ra || "",
      };
    });
  }

  function handleCSV() {
    const dataOut = baseExportRows();
    if (!dataOut.length) return setMsg("Nada para exportar.");
    const fn = `${BRAND.name}-caixa-${data}-${turno}.csv`;
    downloadCSV(
      [
        { __relatorio__: `${BRAND.name} — Caixa (pedidos_teste)`, __gerado_em__: new Date().toLocaleString() },
        ...dataOut,
      ],
      fn
    );
  }

  function handleXLSX() {
    const dataOut = baseExportRows();
    if (!dataOut.length) return setMsg("Nada para exportar.");
    const fn = `${BRAND.name}-caixa-${data}-${turno}.xlsx`;
    downloadXLSX(dataOut, fn, "Caixa");
  }

  function handlePDF() {
    const dataOut = baseExportRows();
    if (!dataOut.length) return setMsg("Nada para exportar.");
    const ts = new Date().toLocaleString();
    const thead = `<tr>
      <th>Data</th><th>Hora</th><th>Turno</th><th>Status</th>
      <th>Produto</th><th>Categoria</th><th>Qtd</th><th>Unit (R$)</th><th>Total (R$)</th><th>Cliente</th><th>RA</th>
    </tr>`;
    const tbody = dataOut.map(r => `
      <tr>
        <td>${r.data}</td>
        <td>${r.hora}</td>
        <td>${r.turno}</td>
        <td>${r.status}</td>
        <td>${r.produto}</td>
        <td>${r.categoria}</td>
        <td>${r.quantidade}</td>
        <td>${Number(r.unit_price).toFixed(2)}</td>
        <td>${Number(r.total_price).toFixed(2)}</td>
        <td>${r.cliente}</td>
        <td>${r.ra}</td>
      </tr>
    `).join("");

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${BRAND.name} — Caixa</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root{ --border:rgba(0,0,0,.15); }
  body{ margin:0; background:linear-gradient(135deg,#0b1220,#0f172a 45%,#065f46 110%);
        color:#e5e7eb; font:14px/1.5 ui-sans-serif,system-ui; }
  .wrap{ padding:28px; }
  .brand{ display:flex; align-items:center; gap:14px; margin-bottom:12px; }
  .brand img{ width:48px; height:48px; object-fit:contain; border-radius:10px; background:#08101f; }
  h1{ margin:0; font-size:20px; }
  .meta{ display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin:8px 0 16px; }
  .tag{ padding:4px 8px; border:1px solid rgba(255,255,255,.2); border-radius:999px; background:rgba(255,255,255,.06) }
  table{ width:100%; border-collapse:collapse; background:rgba(255,255,255,.04); border-radius:12px; overflow:hidden; }
  th,td{ border:1px solid rgba(255,255,255,.12); padding:8px 10px; text-align:left; }
  thead th{ background:rgba(255,255,255,.06); }
  tfoot td{ font-weight:700; background:rgba(255,255,255,.08); }
  .kpis{ display:flex; gap:12px; margin:12px 0 18px; }
  .k{ padding:8px 12px; border-radius:10px; background:rgba(255,255,255,.06); }
  @media print{
    body{ background:#fff; color:#000; }
    .tag{ border-color:#ddd; background:#fff; }
    th,td{ border-color:#ddd; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="brand">
      <img src="${abs(BRAND.logo)}" alt="logo"/>
      <div>
        <h1>${BRAND.name} — Caixa</h1>
        <div style="opacity:.8;font-size:12px">Gerado em ${ts}</div>
      </div>
    </div>

    <div class="meta">
      <span class="tag"><strong>Fonte:</strong> pedidos_teste</span>
      <span class="tag"><strong>Data:</strong> ${data}</span>
      <span class="tag"><strong>Turno:</strong> ${turno}</span>
      <span class="tag"><strong>Status:</strong> ${statusSel}</span>
      <span class="tag"><strong>Registros:</strong> ${dataOut.length}</span>
    </div>

    <div class="kpis">
      <div class="k"><strong>Entradas (confirmado):</strong> R$ ${kpis.entradas.toFixed(2)}</div>
      <div class="k"><strong>Pendente (em_preparo):</strong> R$ ${kpis.pendente.toFixed(2)}</div>
      <div class="k"><strong>Saldo:</strong> R$ ${kpis.saldo.toFixed(2)}</div>
      <div class="k"><strong>Pedidos:</strong> ${kpis.qtdPedidos}</div>
    </div>

    <table>
      <thead>${thead}</thead>
      <tbody>${tbody}</tbody>
      <tfoot>
        <tr><td colspan="8">Entradas (confirmado)</td><td colspan="3">R$ ${kpis.entradas.toFixed(2)}</td></tr>
        <tr><td colspan="8">Pendente (em_preparo)</td><td colspan="3">R$ ${kpis.pendente.toFixed(2)}</td></tr>
        <tr><td colspan="8">Saldo</td><td colspan="3">R$ ${kpis.saldo.toFixed(2)}</td></tr>
      </tfoot>
    </table>
  </div>
  <script>window.addEventListener('load', ()=>setTimeout(()=>window.print(), 180));</script>
</body>
</html>`;
    try { printHTML(html); } catch (e) { setMsg("Falha ao abrir impressão."); }
  }

  return (
    <div className="cx-page">
      <div className="cx-header">
        <div className="cx-title">
          <img src={BRAND.logo} alt="Logo" />
          <div>
            <h1>Módulo de Caixa / Financeiro</h1>
            <p>Valores e status vindos de <code>pedidos_teste</code>.</p>
          </div>
        </div>

        <div className="cx-filters">
          <div className="field">
            <label>Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="field">
            <label>Turno</label>
            <select value={turno} onChange={(e) => setTurno(e.target.value)}>
              {TURNOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={statusSel} onChange={(e) => setStatusSel(e.target.value)}>
              <option value="Todos">Todos</option>
              {STATUS_OPS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field field-grow">
            <label>Buscar</label>
            <input placeholder="Produto, cliente ou RA…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </div>

      <section className="cx-kpis">
        <div className="kcard ok">
          <h3>Entradas (confirmado)</h3>
          <p>R$ {kpis.entradas.toFixed(2)}</p>
        </div>
        <div className="kcard warn">
          <h3>Pendente (em_preparo)</h3>
          <p>R$ {kpis.pendente.toFixed(2)}</p>
        </div>
        <div className="kcard total">
          <h3>Saldo</h3>
          <p>R$ {kpis.saldo.toFixed(2)}</p>
        </div>
        <div className="kcard info">
          <h3>Pedidos</h3>
          <p>{kpis.qtdPedidos}</p>
        </div>
      </section>

      <section className="cx-actions">
        <button className="btn" onClick={handleCSV}>CSV</button>
        <button className="btn" onClick={handleXLSX}>Excel</button>
        <button className="btn primary" onClick={handlePDF}>Exportar PDF / Imprimir</button>
      </section>

      {loading ? (
        <div className="cx-loading">Carregando pedidos…</div>
      ) : (
        <div className="cx-table-wrap">
          <table className="cx-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Turno</th>
                <th>Status</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Qtd</th>
                <th>Unit (R$)</th>
                <th>Total (R$)</th>
                <th>Cliente</th>
                <th>RA</th>
              </tr>
            </thead>
            <tbody>
              {rowsFiltered.length ? rowsFiltered.map(r => {
                const d = new Date(r.order_date);
                const prod = productsMap.get(r.product_id);
                return (
                  <tr key={r.id}>
                    <td>{format(d, "HH:mm")}</td>
                    <td>{turnoFromDate(d)}</td>
                    <td className={`st st-${r.status}`}>
                      <select
                        value={r.status}
                        onChange={(e) => changeStatus(r.id, e.target.value)}
                        className="st-select"
                      >
                        {STATUS_OPS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>{prod?.name || r.product_id}</td>
                    <td>{prod?.category || ""}</td>
                    <td>{r.quantity}</td>
                    <td>{Number(r.unit_price ?? 0).toFixed(2)}</td>
                    <td>{Number(r.total_price ?? 0).toFixed(2)}</td>
                    <td>{r.user_name || "—"}</td>
                    <td>{r.user_ra || "—"}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={10} className="cx-empty">Nenhum pedido encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {msg && <div className="cx-msg">{msg}</div>}
    </div>
  );
}
