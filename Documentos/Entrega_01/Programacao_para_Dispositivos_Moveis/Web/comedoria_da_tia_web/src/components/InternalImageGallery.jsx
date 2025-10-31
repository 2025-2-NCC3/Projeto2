// src/components/InternalImageGallery.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import supabase from "../lib/supabaseClient";
import { RefreshCcw, Copy, ExternalLink, ImageOff } from "lucide-react";

export default function InternalImageGallery() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const lastLoadRef = useRef(0);

  const safeUrl = (u) => (typeof u === "string" ? u : "");

  const loadImages = useCallback(async () => {
    // anti-spam: evita múltiplos cliques muito rápidos
    const now = Date.now();
    if (now - lastLoadRef.current < 800) return;
    lastLoadRef.current = now;

    setErr("");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_images")
        .select("id, image_url, thumb_url, tags, author, source, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setList(data ?? []);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Falha ao carregar imagens.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  async function copyUrl(id, url) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      // fallback simples se o navegador bloquear
      const ok = window.confirm(
        "Não consegui copiar automaticamente. Deseja ver a URL para copiar?"
      );
      if (ok) window.prompt("Copie a URL:", url);
    }
  }

  function openInNew(url) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="imgbank-panel">
      {/* ===== HEADER ===== */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          rowGap: 10,
          columnGap: 10,
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        {/* Título */}
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <h2 style={{ marginBottom: 4 }}>Biblioteca interna</h2>
          <div className="imgbank-hint" style={{ fontSize: 11, lineHeight: 1.4 }}>
            Imagens salvas em <code>product_images</code>. Clique para abrir em
            nova aba ou copie a URL.
          </div>
        </div>

        {/* Ações */}
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            justifyContent: "flex-end",
            width: "auto",
          }}
        >
          <button
            onClick={loadImages}
            className="btn-outline btn-xs"
            disabled={loading}
            style={{
              fontSize: 12,
              lineHeight: 1.2,
              minHeight: 32,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 8,
              opacity: loading ? 0.7 : 1,
              pointerEvents: loading ? "none" : "auto",
            }}
            aria-busy={loading ? "true" : "false"}
          >
            <RefreshCcw size={14} />
            {loading ? "Atualizando..." : "Recarregar"}
          </button>
        </div>
      </div>

      {/* ===== INFO / ERRO ===== */}
      <div
        className="imgbank-hint"
        style={{ fontSize: 12, lineHeight: 1.4, wordBreak: "break-word", marginTop: 6 }}
      >
        Copie a URL e cole no campo <strong>Imagem do produto</strong>.
      </div>
      {err && (
        <div
          role="alert"
          style={{
            marginTop: 8,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(239,68,68,.35)",
            background: "rgba(239,68,68,.08)",
            color: "#fecaca",
            fontSize: 12,
          }}
        >
          {err}
        </div>
      )}

      {/* ===== LOADING ===== */}
      {loading && (
        <div className="imgbank-status" style={{ marginTop: 10 }}>
          Carregando...
        </div>
      )}

      {/* ===== EMPTY ===== */}
      {!loading && !err && list.length === 0 && (
        <div className="imgbank-status" style={{ marginTop: 10 }}>
          Nenhuma imagem salva ainda.
        </div>
      )}

      {/* ===== GRID ===== */}
      {!loading && !err && list.length > 0 && (
        <div className="gallery-grid" style={{ marginTop: 12 }}>
          {list.map((img) => {
            const thumb = safeUrl(img.thumb_url) || safeUrl(img.image_url);
            const full = safeUrl(img.image_url);
            const tags = typeof img.tags === "string" ? img.tags : img.tags ?? "";
            const author = img.author || "desconhecido";
            const source = img.source || "?";
            const created = img.created_at ? new Date(img.created_at) : null;

            return (
              <article
                key={img.id}
                className="imgcard"
                style={{
                  overflow: "hidden",
                  minWidth: 0,
                  display: "grid",
                  gridTemplateRows: "auto 1fr",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                {/* Thumb clicável */}
                {thumb ? (
                  <button
                    onClick={() => openInNew(full)}
                    className="imgcard-thumb-btn"
                    title="Abrir imagem em nova aba"
                    style={{
                      display: "block",
                      padding: 0,
                      border: 0,
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      className="gallery-thumb"
                      src={thumb}
                      alt={tags || "imagem do produto"}
                      style={{
                        width: "100%",
                        height: 120,
                        objectFit: "cover",
                        background: "#1e2537",
                        borderBottom: "1px solid var(--border)",
                      }}
                    />
                  </button>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: 120,
                      display: "grid",
                      placeItems: "center",
                      background: "#1e2537",
                      borderBottom: "1px solid var(--border)",
                      color: "var(--muted)",
                    }}
                  >
                    <ImageOff size={18} /> sem imagem
                  </div>
                )}

                {/* Info */}
                <div
                  className="gallery-info"
                  style={{
                    display: "grid",
                    gap: 8,
                    minWidth: 0,
                    padding: 10,
                  }}
                >
                  {/* tags */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      alignItems: "center",
                    }}
                  >
                    {String(tags)
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((t) => (
                        <span
                          key={t}
                          className="pill"
                          style={{
                            background: "rgba(255,255,255,.08)",
                            border: "1px solid var(--border)",
                            borderRadius: 999,
                            padding: "3px 8px",
                            fontSize: 11,
                            color: "#d1fae5",
                          }}
                          title={t}
                        >
                          {t}
                        </span>
                      ))}
                    {!tags && (
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>sem tags</span>
                    )}
                  </div>

                  {/* fonte + autor + data */}
                  <div
                    style={{
                      fontSize: 10,
                      lineHeight: 1.3,
                      color: "var(--muted)",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      wordBreak: "break-word",
                    }}
                  >
                    <span>{source}</span>
                    <span>•</span>
                    <span>{author}</span>
                    {created && (
                      <>
                        <span>•</span>
                        <span>{created.toLocaleDateString()}</span>
                      </>
                    )}
                  </div>

                  {/* Ações */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <button
                      className="copy-btn"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        textAlign: "center",
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "rgba(255,255,255,.06)",
                        color: "var(--text)",
                        cursor: "pointer",
                      }}
                      onClick={() => copyUrl(img.id, full)}
                      aria-live="polite"
                    >
                      <Copy size={14} />
                      <span
                        style={{
                          fontSize: 11,
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {copiedId === img.id ? "Copiado!" : "Copiar URL"}
                      </span>
                    </button>

                    <button
                      className="btn-outline btn-xs"
                      onClick={() => openInNew(full)}
                      title="Abrir imagem em nova aba"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                      }}
                    >
                      <ExternalLink size={14} />
                      <span style={{ fontSize: 11 }}>Abrir</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ===== MEDIA QUERIES INLINE ===== */}
      <style>{`
        @media(max-width:600px){
          .imgbank-panel > div:first-child{
            flex-direction:column !important;
            align-items:flex-start !important;
          }
          .imgbank-panel > div:first-child > div:last-child{
            width:100% !important;
            justify-content:flex-start !important;
          }
          .imgbank-panel > div:first-child > div:last-child button{
            width:100% !important;
          }
          .imgcard .gallery-thumb{ height: 110px !important; }
        }
      `}</style>
    </div>
  );
}
