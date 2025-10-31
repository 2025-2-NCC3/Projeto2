import { motion } from "framer-motion";
import { Images, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import PixabayBrowser from "../../components/PixabayBrowser";
import InternalImageGallery from "../../components/InternalImageGallery";
import "./BancoDeImagens.css";

export default function BancoDeImagens() {
  return (
    <div className="imgbank-page">
      {/* TOPO */}
      <div className="imgbank-topbar">
        <div className="imgbank-title">
          <div className="imgbank-iconwrap">
            <Images size={28} />
          </div>
          <div className="imgbank-titleset">
            <h1>Banco de Imagens</h1>
            <p className="imgbank-sub">
              Central de mídia da <strong>Comedoria da Tia</strong> — encontre e
              salve imagens para produtos, banners e promoções.
            </p>
          </div>
        </div>

        <div className="imgbank-actions">
          <Link className="btn-outline" to="/app/produtos">
            <ArrowLeft size={16} />
            Voltar para produtos
          </Link>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <motion.div
        className="imgbank-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="imgbank-grid">
          {/* Painel 1: Pixabay */}
          <motion.div
            className="imgbank-panel"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            <PixabayBrowser
              onImageSaved={() =>
                console.log("Imagem salva na galeria interna")
              }
            />
          </motion.div>

          {/* Painel 2: Galeria interna */}
          <motion.div
            className="imgbank-panel"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            <InternalImageGallery />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
