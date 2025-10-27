import { motion } from "framer-motion";
import { Images, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import PixabayBrowser from "../../components/PixabayBrowser";
import InternalImageGallery from "../../components/InternalImageGallery";

import "./BancoDeImagens.css"; // novo css dark

export default function BancoDeImagens() {
  return (
    <div className="imgbank-page">
      {/* Topbar parecida com Promoções */}
      <div className="imgbank-topbar">
        <div className="imgbank-title">
          <Images />
          <div style={{ display: "grid", gap: 2 }}>
            <h1>Banco de Imagens</h1>
            <p className="imgbank-sub">
              Central de mídia da Comedoria da Tia • pronto pra usar nos
              produtos e promoções.
            </p>
          </div>
        </div>

        <div className="imgbank-actions">
          <Link className="btn-outline btn-xs" to="/app/produtos">
            <ArrowLeft size={16} />
            Voltar para produtos
          </Link>
        </div>
      </div>

      {/* Card grandão com os 2 painéis lado a lado */}
      <motion.div
        className="imgbank-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="imgbank-grid">
          {/* LADO ESQUERDO: buscar/salvar do Pixabay */}
          <PixabayBrowser
            onImageSaved={() => {
              // Se quiser emitir um toast global depois você pluga o notify
              // ou dispara um evento customizado.
              console.log("Imagem salva na galeria interna");
            }}
          />

          {/* LADO DIREITO: galeria interna */}
          <InternalImageGallery />
        </div>
      </motion.div>
    </div>
  );
}
