"use client";

import { useEffect, useMemo, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { Save, RefreshCw, Plus, Trash2, AlertTriangle } from "lucide-react";
import "./Settings.css";

const DEFAULT_SETTINGS = {
  brand_name: "Comedoria da Tia",
  brand_logo_url: "/logo.png",
  dark_mode: true,
  timezone: "America/Sao_Paulo",
  price_format: "comma", // "comma" | "dot"
  notify_new_orders: true,
  notify_promotions: true,
  pixabay_api_key: "",
};

/**
 * A tela salva e lê as configs em 'app_settings' (linha única "id = default").
 * Se a tabela não existir, a UI segue operando com defaults e avisa no topo.
 *
 * Tabelas opcionais suportadas:
 * - app_settings   (id text pk, jsonb columns or flattened columns como abaixo)
 *   Exemplo schema recomendado:
 *   create table if not exists public.app_settings (
 *     id text primary key,
 *     brand_name text,
 *     brand_logo_url text,
 *     dark_mode boolean,
 *     timezone text,
 *     price_format text,
 *     notify_new_orders boolean,
 *     notify_promotions boolean,
 *     pixabay_api_key text,
 *     updated_at timestamp default now()
 *   );
 *
 * - product_categories (id uuid default gen_random_uuid() pk, name text unique)
 *   create table if not exists public.product_categories (
 *     id uuid primary key default gen_random_uuid(),
 *     name text unique not null
 *   );
 */

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [warn, setWarn] = useState(""); // mostra aviso quando tables não existem
  const [hasAppSettings, setHasAppSettings] = useState(true);

  // Categorias
  const [categories, setCategories] = useState([]);
  const [catInput, setCatInput] = useState("");
  const [loadingCats, setLoadingCats] = useState(true);
  const [catsMode, setCatsMode] = useState("db"); // "db" (product_categories) | "fallback"

  async function loadSettings() {
    setLoading(true);
    setWarn("");
    try {
      // tenta ler de app_settings (id='default')
      let got = null;
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select(
            "brand_name, brand_logo_url, dark_mode, timezone, price_format, notify_new_orders, notify_promotions, pixabay_api_key"
          )
          .eq("id", "default")
          .single();
        if (error) throw error;
        got = data;
        setHasAppSettings(true);
      } catch (e) {
        // tabela não existe ou linha ausente
        setHasAppSettings(false);
      }

      if (got) {
        setSettings((prev) => ({
          ...prev,
          ...got,
        }));
      } else {
        // mantém defaults
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (e) {
      setWarn("Não foi possível carregar app_settings. Usando configurações padrão.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    setLoadingCats(true);
    setWarn((w) => w); // manter
    try {
      // 1) tenta product_categories
      try {
        const { data, error } = await supabase
          .from("product_categories")
          .select("name")
          .order("name", { ascending: true });
        if (error) throw error;
        setCategories((data ?? []).map((r) => r.name));
        setCatsMode("db");
      } catch {
        // 2) fallback: distinct de produtos_teste.category
        const { data, error } = await supabase
          .from("produtos_teste")
          .select("category", { count: "exact", head: false })
          .neq("category", null);
        if (error) throw error;
        const uniq = Array.from(new Set((data ?? []).map((r) => r.category))).sort();
        setCategories(uniq);
        setCatsMode("fallback");
      }
    } catch (e) {
      console.error(e);
      setWarn((w) =>
        w ||
        "Não consegui carregar as categorias. Verifique se a tabela product_categories existe ou se produtos_teste tem dados."
      );
      setCategories([]);
    } finally {
      setLoadingCats(false);
    }
  }

  useEffect(() => {
    loadSettings();
    loadCategories();
  }, []);

  async function saveSettings(e) {
    e?.preventDefault?.();
    setSaving(true);
    setMsg("");
    setWarn("");

    try {
      // upsert em app_settings (id='default')
      const payload = {
        id: "default",
        ...settings,
      };

      const { error } = await supabase
        .from("app_settings")
        .upsert(payload, { onConflict: "id" });
      if (error) throw error;

      setMsg("Configurações salvas com sucesso!");
      setHasAppSettings(true);
    } catch (e) {
      console.error(e);
      setWarn(
        "Falha ao salvar app_settings. Crie a tabela recomendada (veja o comentário no código) ou ajuste permissões RLS."
      );
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 2000);
    }
  }

  async function addCategory() {
    const name = (catInput || "").trim();
    if (!name) return;

    // visual/otimista
    if (!categories.includes(name)) {
      setCategories((prev) => [...prev, name].sort());
    }
    setCatInput("");

    // persiste somente se tabela product_categories existir
    if (catsMode === "db") {
      try {
        const { error } = await supabase
          .from("product_categories")
          .insert({ name });
        if (error) throw error;
      } catch (e) {
        console.error(e);
        setWarn(
          "Não consegui inserir a categoria em product_categories. Verifique a tabela/permissões."
        );
      }
    } else {
      // fallback: mostra alerta amigável
      setWarn(
        "Categorias estão em modo somente-leitura (fallback). Crie a tabela product_categories para persistir novas categorias e atualize o CHECK de produtos_teste."
      );
    }
  }

  async function deleteCategory(name) {
    // Remove visual
    setCategories((prev) => prev.filter((c) => c !== name));
    // Persiste somente se houver product_categories
    if (catsMode === "db") {
      try {
        const { error } = await supabase
          .from("product_categories")
          .delete()
          .eq("name", name);
        if (error) throw error;
      } catch (e) {
        console.error(e);
        setWarn("Não consegui remover a categoria no banco (product_categories).");
      }
    } else {
      setWarn(
        "Remoção local apenas. Crie a tabela product_categories para gerenciamento completo."
      );
    }
  }

  const canSave = useMemo(() => !saving && !loading, [saving, loading]);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="sh-title">
          <img
            src={settings.brand_logo_url || "/logo.png"}
            alt="Logo"
            onError={(e) => (e.currentTarget.src = "/logo.png")}
          />
          <div>
            <h1>Configurações</h1>
            <p>Preferências do sistema, branding, categorias e integrações.</p>
          </div>
        </div>

        <div className="sh-actions">
          <button className="btn-outline" onClick={() => { loadSettings(); loadCategories(); }}>
            <RefreshCw size={16} />
            Recarregar
          </button>
          <button className="btn-primary" onClick={saveSettings} disabled={!canSave}>
            <Save size={16} />
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      {(warn || !hasAppSettings || catsMode === "fallback") && (
        <div className="settings-alert">
          <AlertTriangle size={16} />
          <div>
            <strong>Atenção:</strong>{" "}
            {warn ||
              (!hasAppSettings &&
                "A tabela app_settings não foi encontrada. A tela usa valores padrão. Crie a tabela para persistir.") ||
              (catsMode === "fallback" &&
                "Categorias em modo fallback (distinct de produtos_teste). Crie a tabela product_categories para persistir novas categorias.")}
          </div>
        </div>
      )}

      {loading ? (
        <div className="settings-loading">Carregando configurações…</div>
      ) : (
        <form className="settings-grid" onSubmit={saveSettings}>
          {/* Branding */}
          <section className="s-card">
            <h2>Identidade & Branding</h2>
            <div className="form-grid">
              <label className="grid-span-2">
                <span>Nome do estabelecimento</span>
                <input
                  className="s-input"
                  value={settings.brand_name}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, brand_name: e.target.value }))
                  }
                  placeholder="Ex.: Comedoria da Tia"
                />
              </label>

              <label className="grid-span-2">
                <span>URL da Logo</span>
                <input
                  className="s-input"
                  value={settings.brand_logo_url}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, brand_logo_url: e.target.value }))
                  }
                  placeholder="/logo.png"
                />
              </label>

              <div className="brand-preview grid-span-2">
                <div className="bp-box">
                  <img
                    src={settings.brand_logo_url || "/logo.png"}
                    alt="Logo preview"
                    onError={(e) => (e.currentTarget.src = "/logo.png")}
                  />
                </div>
                <div className="bp-hint">
                  Pré-visualização — recomendado PNG com fundo transparente.
                </div>
              </div>
            </div>
          </section>

          {/* Preferências */}
          <section className="s-card">
            <h2>Preferências</h2>
            <div className="form-grid">
              <label>
                <span>Tema escuro</span>
                <div className="switch">
                  <input
                    type="checkbox"
                    checked={!!settings.dark_mode}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, dark_mode: e.target.checked }))
                    }
                  />
                  <span>{settings.dark_mode ? "Ativo" : "Desativado"}</span>
                </div>
              </label>

              <label>
                <span>Timezone</span>
                <select
                  className="s-select"
                  value={settings.timezone}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, timezone: e.target.value }))
                  }
                >
                  <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                  <option value="America/Recife">America/Recife</option>
                  <option value="America/Manaus">America/Manaus</option>
                  <option value="UTC">UTC</option>
                </select>
              </label>

              <label>
                <span>Formatação de preço</span>
                <select
                  className="s-select"
                  value={settings.price_format}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, price_format: e.target.value }))
                  }
                >
                  <option value="comma">R$ 10,99 (vírgula)</option>
                  <option value="dot">R$ 10.99 (ponto)</option>
                </select>
              </label>
            </div>
          </section>

          {/* Notificações */}
          <section className="s-card">
            <h2>Notificações</h2>
            <div className="form-grid">
              <label>
                <span>Alertas de novos pedidos</span>
                <div className="switch">
                  <input
                    type="checkbox"
                    checked={!!settings.notify_new_orders}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        notify_new_orders: e.target.checked,
                      }))
                    }
                  />
                  <span>
                    {settings.notify_new_orders ? "Ativo" : "Desativado"}
                  </span>
                </div>
              </label>

              <label>
                <span>Alertas de promoções</span>
                <div className="switch">
                  <input
                    type="checkbox"
                    checked={!!settings.notify_promotions}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        notify_promotions: e.target.checked,
                      }))
                    }
                  />
                  <span>
                    {settings.notify_promotions ? "Ativo" : "Desativado"}
                  </span>
                </div>
              </label>
            </div>
          </section>

          {/* Integrações */}
          <section className="s-card">
            <h2>Integrações</h2>
            <div className="form-grid">
              <label className="grid-span-2">
                <span>Pixabay API Key</span>
                <input
                  className="s-input"
                  value={settings.pixabay_api_key}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, pixabay_api_key: e.target.value }))
                  }
                  placeholder="coloque aqui a chave"
                />
              </label>
              <div className="grid-span-2" style={{ fontSize: 12, color: "var(--muted)" }}>
                Dica: essa chave é usada no módulo Banco de Imagens (Pixabay).
              </div>
            </div>
          </section>

          {/* Categorias */}
          <section className="s-card grid-span-2">
            <h2>Categorias</h2>
            <div className="cat-hint">
              {catsMode === "db" ? (
                <span>
                  Gerenciadas via <code>product_categories</code>.
                </span>
              ) : (
                <span>
                  <strong>Modo fallback:</strong> categorias derivadas de{" "}
                  <code>produtos_teste.category</code>. Para permitir criação/remoção
                  reais, crie a tabela <code>product_categories</code> e atualize o
                  CHECK de <code>produtos_teste</code>.
                </span>
              )}
            </div>

            <div className="cat-line">
              <input
                className="s-input"
                placeholder="Nova categoria…"
                value={catInput}
                onChange={(e) => setCatInput(e.target.value)}
              />
              <button type="button" className="btn-primary" onClick={addCategory}>
                <Plus size={16} />
                Adicionar
              </button>
            </div>

            <div className="cat-grid">
              {loadingCats ? (
                <div className="settings-loading">Carregando categorias…</div>
              ) : categories.length ? (
                categories.map((c) => (
                  <div key={c} className="cat-chip">
                    <span>{c}</span>
                    <button
                      type="button"
                      className="btn-chip-del"
                      onClick={() => deleteCategory(c)}
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="settings-empty">Nenhuma categoria.</div>
              )}
            </div>

            {catsMode === "fallback" && (
              <div className="settings-note">
                Para permitir novas categorias no banco, atualize o CHECK de
                <code> produtos_teste.category</code> incluindo os novos valores.
              </div>
            )}
          </section>

          {/* Footer save (mobile) */}
          <div className="settings-actions-bottom grid-span-2">
            <button className="btn-primary" onClick={saveSettings} disabled={!canSave}>
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      )}

      {msg && <div className="settings-msg">{msg}</div>}
    </div>
  );
}
