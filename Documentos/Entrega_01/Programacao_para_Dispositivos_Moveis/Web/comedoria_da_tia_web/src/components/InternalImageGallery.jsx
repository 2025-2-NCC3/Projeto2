import { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";
import { RefreshCcw, Copy } from "lucide-react";

export default function InternalImageGallery() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadImages() {
    setLoading(true);

    const { data, error } = await supabase
      .from("product_images")
      .select("id, image_url, thumb_url, tags, author, source, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setList(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadImages();
  }, []);

  return (
    <div className="imgbank-panel">
      {/* ===== HEADER DO PAINEL ===== */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          rowGap: "10px",
          columnGap: "10px",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        {/* bloco do título */}
        <div
          style={{
            minWidth: 0,
            flex: "1 1 auto",
          }}
        >
          <h2 style={{ marginBottom: 4 }}>Biblioteca interna</h2>
          <div className="imgbank-hint" style={{ fontSize: 11, lineHeight: 1.4 }}>
            Imagens já salvas no banco (<code>product_images</code>)
          </div>
        </div>

        {/* bloco do botão recarregar */}
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "8px",
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
            }}
          >
            <RefreshCcw size={14} />
            {loading ? "Atualizando..." : "Recarregar"}
          </button>
        </div>
      </div>

      {/* ===== TEXTO INTRO ===== */}
      <div
        className="imgbank-hint"
        style={{
          fontSize: 12,
          lineHeight: 1.4,
          wordBreak: "break-word",
        }}
      >
        Essas imagens já estão salvas no banco (<code>product_images</code>).
        Você pode copiar a URL e colar direto no campo "Imagem" do produto.
      </div>

      {/* ===== ESTADO: CARREGANDO ===== */}
      {loading && <div className="imgbank-status">Carregando...</div>}

      {/* ===== ESTADO: VAZIO ===== */}
      {!loading && !list.length && (
        <div className="imgbank-status">Nenhuma imagem salva ainda.</div>
      )}

      {/* ===== GALERIA ===== */}
      {!loading && list.length > 0 && (
        <div className="gallery-grid">
          {list.map((img) => (
            <div
              key={img.id}
              className="imgcard"
              style={{
                overflow: "hidden",
                minWidth: 0, // evita overflow horizontal em colunas muito estreitas
              }}
            >
              <img
                className="gallery-thumb"
                src={img.thumb_url || img.image_url}
                alt={img.tags || "imagem do produto"}
                style={{
                  width: "100%",
                  height: "100px",
                  objectFit: "cover",
                  background: "#1e2537",
                  borderBottom: "1px solid var(--border)",
                }}
              />

              <div
                className="gallery-info"
                style={{
                  display: "grid",
                  gap: "6px",
                  minWidth: 0,
                }}
              >
                {/* tags */}
                <div
                  style={{
                    fontSize: 11,
                    lineHeight: 1.3,
                    color: "var(--muted)",
                    wordBreak: "break-word",
                  }}
                >
                  {img.tags || "sem tags"}
                </div>

                {/* fonte + autor */}
                <div
                  style={{
                    fontSize: 10,
                    lineHeight: 1.3,
                    color: "var(--muted)",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px",
                    wordBreak: "break-word",
                  }}
                >
                  <span>{img.source || "?"}</span>
                  <span>•</span>
                  <span>{img.author || "desconhecido"}</span>
                </div>

                {/* botão copiar */}
                <button
                  className="copy-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    textAlign: "center",
                    width: "100%",
                    wordBreak: "break-word",
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(img.image_url);
                    alert("URL copiada ✅");
                  }}
                >
                  <Copy size={14} />
                  <span
                    style={{
                      fontSize: 11,
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Copiar URL
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== RODAPÉ TEXTO ===== */}
      <div
        className="imgbank-hint"
        style={{
          textAlign: "right",
          fontSize: 11,
          lineHeight: 1.4,
          wordBreak: "break-word",
        }}
      >
        Copiou a URL? Agora é só colar em "Imagem do produto" 👌
      </div>

      {/* ===== MEDIA QUERIES INLINE VIA STYLE TAG =====
           Isso garante comportamento mobile do header/botão
           sem precisar mexer no resto do app agora.
      */}
      <style>{`
        @media(max-width:600px){
          /* Header vira colunado pra não quebrar feio */
          .imgbank-panel > div:first-child{
            flex-direction:column !important;
            align-items:flex-start !important;
          }

          /* Bloco do botão recarregar ocupa linha própria */
          .imgbank-panel > div:first-child > div:last-child{
            width:100% !important;
            justify-content:flex-start !important;
          }

          .imgbank-panel > div:first-child > div:last-child button{
            width:100% !important;
          }
        }

        @media(max-width:400px){
          /* Deixa o thumb menos achatado, respira */
          .imgbank-panel .gallery-thumb{
            height:110px !important;
          }
        }
      `}</style>
    </div>
  );
}
