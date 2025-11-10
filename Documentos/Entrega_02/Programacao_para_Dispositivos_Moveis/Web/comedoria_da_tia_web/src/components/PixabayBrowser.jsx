import { useState } from "react";
import { usePixabaySearch } from "../lib/usePixabaySearch";
import supabase from "../lib/supabaseClient";
import { Image as ImageIcon, DownloadCloud } from "lucide-react";

export default function PixabayBrowser({ onImageSaved }) {
  const { results, loading, errorMsg, searchPixabay } = usePixabaySearch();
  const [term, setTerm] = useState("");
  const [savingId, setSavingId] = useState(null);

  async function handleSave(img) {
    try {
      setSavingId(img.id);
      const { error } = await supabase.from("product_images").insert({
        image_url: img.largeImageURL,
        thumb_url: img.previewURL,
        tags: img.tags,
        author: img.user,
        source: "pixabay",
      });

      if (error) {
        console.error(error);
        alert("Erro ao salvar imagem 😢");
      } else {
        alert("Imagem salva na biblioteca interna ✅");
        onImageSaved && onImageSaved();
      }
    } finally {
      setSavingId(null);
    }
  }

  function handleSearchClick() {
    if (!term.trim()) return;
    searchPixabay(term.trim());
  }

  return (
    <div
      className="imgbank-panel"
      style={{
        minWidth: 0,
        width: "100%",
        display: "block",
        margin: "0 auto",
        backgroundColor: "transparent",
        borderRadius: 12,
      }}
    >
      {/* ===== HEADER DO PAINEL ===== */}
      <div
        className="pixabay-header-row"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          minWidth: 0,
        }}
      >
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            margin: 0,
            wordBreak: "break-word",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "var(--text, #fff)",
          }}
        >
          <ImageIcon size={16} />
          <span>Buscar imagens gratuitas (Pixabay)</span>
        </h2>

        <div
          className="imgbank-hint"
          style={{
            fontSize: 12,
            lineHeight: 1.4,
            color: "var(--muted, #94a3b8)",
            wordBreak: "break-word",
          }}
        >
          Digite o nome do item (ex.: "coxinha", "sanduíche natural",
          "refrigerante lata"). Salve no acervo interno pra usar depois.
        </div>
      </div>

      {/* ===== BUSCA ===== */}
      <div className="imgbank-field" style={{ minWidth: 0 }}>
        <label
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: "var(--text, #fff)",
            lineHeight: 1.3,
            wordBreak: "break-word",
            display: "block",
            marginBottom: 6,
          }}
        >
          Buscar imagem
        </label>

        <div
          className="imgbank-searchrow pixabay-search-wrap"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "stretch",
            gap: "8px",
            minWidth: 0,
          }}
        >
          <input
            className="imgbank-input"
            style={{
              flex: "1 1 220px",
              minWidth: 0,
              backgroundColor: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(148,163,184,0.3)",
              borderRadius: 10,
              color: "var(--text, #fff)",
              fontSize: 14,
              lineHeight: 1.4,
              padding: "10px 12px",
              outline: "none",
              width: "100%",
            }}
            placeholder='ex.: pastel de carne, suco laranja...'
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
            disabled={loading}
          />

          <button
            onClick={handleSearchClick}
            className="btn-primary btn-xs search-btn"
            disabled={loading}
            style={{
              fontSize: 13,
              lineHeight: 1.2,
              flexShrink: 0,
              minHeight: 40,
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              whiteSpace: "nowrap",
              background:
                "linear-gradient(to right,#3B82F6,#6366F1,#8B5CF6)",
              color: "#fff",
              border: "0",
              cursor: "pointer",
              width: "auto",
            }}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      {/* ===== ESTADOS ===== */}
      {errorMsg && (
        <div
          className="imgbank-status"
          style={{
            color: "#f87171",
            wordBreak: "break-word",
            textAlign: "center",
            fontSize: 13,
            marginTop: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      {loading && !errorMsg && (
        <div
          className="imgbank-status"
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--muted, #94a3b8)",
            marginTop: 12,
          }}
        >
          Buscando imagens...
        </div>
      )}

      {/* ===== RESULTADOS ===== */}
      {!loading && results.length > 0 && (
        <div
          className="imgbank-results-grid"
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "12px",
          }}
        >
          {results.map((img) => (
            <div
              key={img.id}
              className="imgcard"
              style={{
                minWidth: 0,
                overflow: "hidden",
                borderRadius: 12,
                backgroundColor: "rgba(30,41,59,0.6)",
                border: "1px solid rgba(148,163,184,0.2)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "140px",
                  background: "#1e2537",
                  overflow: "hidden",
                }}
                className="imgcard-thumb-wrap"
              >
                <img
                  className="imgcard-thumb"
                  src={img.previewURL}
                  alt={img.tags}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>

              <div
                className="imgcard-body"
                style={{
                  display: "grid",
                  gap: "6px",
                  padding: "10px 12px 12px",
                }}
              >
                <div
                  className="imgcard-tags"
                  style={{
                    color: "var(--muted, #94a3b8)",
                    fontSize: 12,
                    lineHeight: 1.3,
                    maxHeight: "2.6em",
                    overflow: "hidden",
                    wordBreak: "break-word",
                  }}
                >
                  {img.tags}
                </div>

                <div
                  className="imgcard-meta"
                  style={{
                    color: "var(--muted, #64748b)",
                    fontSize: 11,
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}
                >
                  by {img.user || "autor desconhecido"}
                </div>

                <div
                  className="imgcard-footer"
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() => handleSave(img)}
                    disabled={savingId === img.id}
                    className="btn-primary btn-xs"
                    style={{
                      fontSize: 12,
                      lineHeight: 1.2,
                      minHeight: 32,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontWeight: 600,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      background:
                        "linear-gradient(to right,#3B82F6,#6366F1,#8B5CF6)",
                      color: "#fff",
                      border: "0",
                      cursor: "pointer",
                    }}
                  >
                    <DownloadCloud size={14} />
                    {savingId === img.id ? "Salvando..." : "Salvar na galeria"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== ESTADO INICIAL ===== */}
      {!loading && !results.length && !errorMsg && (
        <div
          className="imgbank-status"
          style={{
            wordBreak: "break-word",
            textAlign: "center",
            fontSize: 13,
            color: "var(--muted, #94a3b8)",
            marginTop: 16,
          }}
        >
          Nenhuma busca ainda. Pesquise algo gostoso 😋
        </div>
      )}

      {/* ===== MEDIA QUERIES ===== */}
      <style>{`
        /* Contêiner geral: respiro no mobile e largura máxima no desktop */
        .imgbank-panel {
          padding: 16px;
          max-width: 1280px;
        }

        @media(min-width:640px){
          .imgbank-panel {
            padding: 20px 24px;
          }

          .pixabay-header-row h2 {
            font-size: 1rem;
          }

          .imgbank-hint {
            font-size: 13px;
            max-width: 60ch;
          }
        }

        @media(min-width:1024px){
          .imgbank-panel {
            padding: 24px 32px;
            background-color: rgba(15,23,42,0.4);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(148,163,184,0.2);
          }

          .pixabay-header-row h2 {
            font-size: 1.05rem;
          }

          .imgbank-hint {
            font-size: 13px;
            max-width: 70ch;
          }
        }

        /* ===== BARRA DE BUSCA RESPONSIVA ===== */
        /* Mobile: input em cima, botão full width embaixo */
        @media(max-width:480px){
          .pixabay-search-wrap{
            flex-direction:column;
            align-items:stretch;
          }

          .pixabay-search-wrap .imgbank-input{
            flex:1 1 auto;
            width:100%;
          }

          .pixabay-search-wrap .search-btn{
            width:100%;
          }
        }

        /* Tablet+: input e botão na mesma linha, botão compacto */
        @media(min-width:481px){
          .pixabay-search-wrap{
            flex-wrap:nowrap;
          }
          .pixabay-search-wrap .imgbank-input{
            flex:1 1 auto;
            width:auto;
          }
          .pixabay-search-wrap .search-btn{
            width:auto;
          }
        }

        /* ===== GRID DE RESULTADOS ===== */
        /* mobile: 1 coluna (default inline no style) */
        @media(min-width:500px){
          .imgbank-results-grid{
            grid-template-columns: repeat(2, minmax(0,1fr));
          }
        }

        @media(min-width:768px){
          .imgbank-results-grid{
            grid-template-columns: repeat(3, minmax(0,1fr));
            gap:16px;
          }
          .imgcard-thumb-wrap{
            height:160px;
          }
        }

        @media(min-width:1024px){
          .imgbank-results-grid{
            grid-template-columns: repeat(4, minmax(0,1fr));
            gap:20px;
          }
          .imgcard-thumb-wrap{
            height:180px;
          }
        }

        @media(min-width:1440px){
          .imgbank-results-grid{
            grid-template-columns: repeat(5, minmax(0,1fr));
            gap:20px;
          }
          .imgcard-thumb-wrap{
            height:190px;
          }
        }
      `}</style>
    </div>
  );
}
