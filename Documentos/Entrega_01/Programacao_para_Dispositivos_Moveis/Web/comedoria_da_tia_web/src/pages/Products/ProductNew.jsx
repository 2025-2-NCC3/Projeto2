import { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  Tag,
  FileText,
  Boxes,
  UploadCloud,
  ArrowLeft,
  Plus,
  Trash2,
  BadgePercent,
  Calendar,
} from "lucide-react";
import supabase from "../../lib/supabaseClient";
import { useNotifier } from "../../components/Notifier/useNotifier";
import "./ProductNew.css";

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function pairsToObject(pairs) {
  const obj = {};
  for (const { key, value } of pairs) {
    const k = String(key || "").trim();
    if (!k) continue;
    const num = Number(String(value).replace(",", "."));
    obj[k] = !Number.isNaN(num) && String(value).trim() !== "" ? num : value;
  }
  return obj;
}

export default function ProductNew() {
  const navigate = useNavigate();
  const { notify, NotifierHost } = useNotifier();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  
  // Campos para promoção
  const [hasPromotion, setHasPromotion] = useState(false);
  const [promotionPrice, setPromotionPrice] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  // Estados relacionados à imagem
  const [imageFile, setImageFile] = useState(null);
  const [imageUrlManual, setImageUrlManual] = useState("");
  const [galleryList, setGalleryList] = useState([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [saving, setSaving] = useState(false);

  const [features, setFeatures] = useState([{ key: "peso_g", value: "" }]);
  const [nutrition, setNutrition] = useState([
    { key: "kcal", value: "" },
    { key: "carbs_g", value: "" },
    { key: "protein_g", value: "" },
    { key: "fat_g", value: "" },
  ]);

  const autoSlug = useMemo(() => slugify(name), [name]);
  
  function onNameBlur() {
    if (!slug) setSlug(autoSlug);
  }

  // Carrega imagens da galeria
  useEffect(() => {
    async function fetchGallery() {
      const { data, error } = await supabase
        .from("product_images")
        .select("id, image_url, thumb_url, tags")
        .order("id", { ascending: false })
        .limit(50);
      if (error) {
        console.error("Erro carregando galeria:", error);
        return;
      }
      setGalleryList(data || []);
    }
    fetchGallery();
  }, []);

  // Atualiza preview quando seleciona da galeria
  useEffect(() => {
    if (!selectedGalleryId) return;
    const item = galleryList.find((g) => String(g.id) === String(selectedGalleryId));
    if (item) {
      setPreviewUrl(item.image_url || item.thumb_url || "");
      setImageFile(null);
      setImageUrlManual("");
    }
  }, [selectedGalleryId, galleryList]);

  // Atualiza preview quando digita URL manual
  useEffect(() => {
    if (!imageUrlManual.trim()) return;
    setPreviewUrl(imageUrlManual.trim());
    setImageFile(null);
    setSelectedGalleryId("");
  }, [imageUrlManual]);

  function onImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageUrlManual("");
    setSelectedGalleryId("");
  }

  const addRow = (setFn) => setFn((rows) => [...rows, { key: "", value: "" }]);
  const removeRow = (setFn, idx) =>
    setFn((rows) => rows.filter((_, i) => i !== idx));
  const updateRow = (setFn, idx, field, v) =>
    setFn((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: v } : r)));

  // Validação das datas de promoção
  const validatePromotionDates = () => {
    if (!hasPromotion) return true;

    if (!promotionPrice || !startsAt || !endsAt) {
      notify({
        type: "error",
        title: "Dados de promoção incompletos",
        message: "Preencha preço promocional, data inicial e data final.",
      });
      return false;
    }

    const promotionPriceNum = Number(String(promotionPrice).replace(",", "."));
    if (!promotionPriceNum || promotionPriceNum <= 0) {
      notify({
        type: "error",
        title: "Preço promocional inválido",
        message: "Informe um preço promocional válido.",
      });
      return false;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    const now = new Date();

    if (startDate >= endDate) {
      notify({
        type: "error",
        title: "Datas inválidas",
        message: "A data final deve ser posterior à data inicial.",
      });
      return false;
    }

    if (endDate <= now) {
      notify({
        type: "error",
        title: "Data final inválida",
        message: "A data final deve ser futura.",
      });
      return false;
    }

    return true;
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim())
      return notify({
        type: "error",
        title: "Nome obrigatório",
        message: "Informe o nome do produto.",
      });
    
    const finalSlug = slug || autoSlug;
    if (!finalSlug)
      return notify({
        type: "error",
        title: "Slug inválido",
        message: "Não foi possível gerar o slug.",
      });

    // ✅ VALIDAÇÃO DO PREÇO NORMAL (obrigatório)
    const priceNumber = price ? Number(String(price).replace(",", ".")) : null;
    if (!priceNumber || priceNumber <= 0)
      return notify({
        type: "error",
        title: "Preço obrigatório",
        message: "Informe um preço válido para o produto.",
      });

    // Validar promoção se estiver ativa
    if (hasPromotion && !validatePromotionDates()) {
      return;
    }

    const featuresObj = pairsToObject(features);
    const nutritionObj = pairsToObject(nutrition);

    setSaving(true);
    try {
      // ======================================================
      // RESOLVER image_url FINAL
      // ======================================================
      let finalImageUrl = null;

      // 1) Upload de arquivo novo
      if (imageFile) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `products/${finalSlug}_${Date.now()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("products")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type || "image/jpeg",
          });
        if (upErr) {
          console.error("Upload error:", upErr);
          notify({
            type: "error",
            title: "Upload falhou",
            message: upErr.message,
          });
          setSaving(false);
          return;
        }

        const { data: pub } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);
        finalImageUrl = pub?.publicUrl || null;
      }
      // 2) URL manual digitada
      else if (imageUrlManual.trim()) {
        finalImageUrl = imageUrlManual.trim();
      }
      // 3) Imagem da galeria interna
      else if (selectedGalleryId) {
        const item = galleryList.find(
          (g) => String(g.id) === String(selectedGalleryId)
        );
        finalImageUrl = item?.image_url || item?.thumb_url || null;
      }

      // ✅ SALVAR NA TABELA PRODUTOS_TESTE - COM TODOS OS CAMPOS OBRIGATÓRIOS
      const productData = {
        id: crypto.randomUUID(), // ✅ GERAR ID EXPLICITAMENTE
        name: name.trim(),
        slug: finalSlug,
        price: priceNumber, // ✅ PREÇO NORMAL (OBRIGATÓRIO)
        description: description || null,
        image_url: finalImageUrl || null,
        features: featuresObj || {}, // ✅ DEFAULT PARA JSONB
        nutrition: nutritionObj || {}, // ✅ DEFAULT PARA JSONB
        is_active: true,
        has_promotion: hasPromotion,
        promotion_price: hasPromotion ? Number(String(promotionPrice).replace(",", ".")) : null,
        starts_at: hasPromotion ? startsAt : null,
        ends_at: hasPromotion ? endsAt : null,
        stock_qty: 0, // ✅ VALOR DEFAULT
        created_at: new Date().toISOString(), // ✅ TIMESTAMP EXPLÍCITO
        updated_at: new Date().toISOString(), // ✅ TIMESTAMP EXPLÍCITO
      };

      console.log('Enviando dados:', productData);

      const { data: prod, error: pErr } = await supabase
        .from("produtos_teste")
        .insert(productData)
        .select("id, slug, name")
        .single();
        
      if (pErr) {
        console.error('Erro detalhado:', pErr);
        notify({
          type: "error",
          title: "Erro ao salvar produto",
          message: pErr.details || pErr.message || "Erro desconhecido",
        });
        setSaving(false);
        return;
      }

      notify({
        type: "success",
        title: "Produto cadastrado",
        message: hasPromotion 
          ? "Produto criado com promoção ativa!" 
          : "Produto criado com sucesso!",
      });
      
      setTimeout(() => navigate("/app/produtos", { replace: true }), 700);
    } catch (err) {
      console.error('Erro inesperado:', err);
      notify({
        type: "error",
        title: "Erro inesperado",
        message: String(err?.message || err),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pnew-page">
      <NotifierHost />

      <div className="pnew-topbar">
        <Link to="/app/produtos" className="pnew-back">
          <ArrowLeft size={16} />
          Voltar
        </Link>
        <h1>Cadastrar produto</h1>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        onSubmit={handleSubmit}
        className="pnew-card"
      >
        <div className="pnew-grid">
          {/* Coluna de imagem */}
          <div className="pnew-imagecol">
            {/* Prévia */}
            <div className="pnew-imagebox">
              {previewUrl ? (
                <img src={previewUrl} alt="Prévia" />
              ) : (
                <div className="pnew-imageplaceholder">
                  <ImageIcon />
                  <span>Prévia da imagem</span>
                </div>
              )}
            </div>

            {/* Upload direto */}
            <label className="pnew-upload">
              <UploadCloud />
              <span>Selecionar arquivo local</span>
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                hidden
              />
            </label>

            {/* URL manual */}
            <div className="pnew-label">
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                Ou URL da imagem
              </span>
              <input
                type="url"
                placeholder="https://.../minha-imagem.png"
                value={imageUrlManual}
                onChange={(e) => setImageUrlManual(e.target.value)}
              />
              <small className="pnew-help">
                Se preencher aqui, ignora o upload.
              </small>
            </div>

            {/* Selecionar da galeria interna */}
            <div className="pnew-label">
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                Ou escolher da galeria salva
              </span>
              <select
                value={selectedGalleryId}
                onChange={(e) => setSelectedGalleryId(e.target.value)}
                className="pnew-gallery-select"
                style={{
                  width: "100%",
                  borderRadius: 10,
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,.06)",
                  color: "var(--text)",
                  outline: "none",
                }}
              >
                <option value="">-- Nenhuma selecionada --</option>
                {galleryList.map((img) => (
                  <option key={img.id} value={img.id}>
                    {img.tags || img.image_url || img.thumb_url}
                  </option>
                ))}
              </select>
              <small className="pnew-help">
                Essa lista vem de product_images (Pixabay).
              </small>
            </div>

            <p className="pnew-help">
              Formatos: JPG/PNG/WebP. Ideal ~1000px.
            </p>
          </div>

          {/* Coluna de dados */}
          <div className="pnew-fields">
            <label className="pnew-label">
              <span>
                <Tag /> Nome
              </span>
              <input
                type="text"
                placeholder="Ex.: Coxinha de Frango"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={onNameBlur}
              />
            </label>

            <label className="pnew-label">
              <span>
                <Boxes /> Slug (ID único)
              </span>
              <input
                type="text"
                placeholder="coxinha_de_frango"
                value={slug || autoSlug}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
              <small>Usado como identificador no app/API.</small>
            </label>

            <label className="pnew-label">
              <span>
                <FileText /> Descrição
              </span>
              <textarea
                placeholder="Descrição curta do produto…"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            {/* PREÇO NORMAL (OBRIGATÓRIO) */}
            <label className="pnew-label">
              <span>Preço (R$) *</span>
              <input
                inputMode="decimal"
                placeholder="Ex.: 12.50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              <small>Preço normal de venda ao público</small>
            </label>

            {/* SEÇÃO DE PROMOÇÃO */}
            <div className="pnew-promotion-section">
              <label className="pnew-checkbox-label">
                <input
                  type="checkbox"
                  checked={hasPromotion}
                  onChange={(e) => setHasPromotion(e.target.checked)}
                />
                <BadgePercent size={16} />
                <span>Este produto tem promoção</span>
              </label>

              {hasPromotion && (
                <div className="pnew-promotion-fields">
                  <div className="pnew-row">
                    <label className="pnew-label">
                      <span>Preço promocional (R$)</span>
                      <input
                        inputMode="decimal"
                        placeholder="Ex.: 9.90"
                        value={promotionPrice}
                        onChange={(e) => setPromotionPrice(e.target.value)}
                      />
                      <small>Preço com desconto</small>
                    </label>
                  </div>

                  <div className="pnew-row">
                    <label className="pnew-label">
                      <span><Calendar size={14} /> Início da promoção</span>
                      <input
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                      />
                    </label>
                    <label className="pnew-label">
                      <span><Calendar size={14} /> Fim da promoção</span>
                      <input
                        type="datetime-local"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Características */}
            <div className="pnew-kv">
              <div className="pnew-kv-head">
                <h3>Características</h3>
                <button
                  type="button"
                  className="btn-small"
                  onClick={() => addRow(setFeatures)}
                >
                  <Plus size={14} /> Adicionar linha
                </button>
              </div>
              {features.map((row, idx) => (
                <div className="pnew-kv-row" key={`f-${idx}`}>
                  <input
                    className="kv-key"
                    placeholder="ex.: peso_g"
                    value={row.key}
                    onChange={(e) =>
                      updateRow(setFeatures, idx, "key", e.target.value)
                    }
                  />
                  <input
                    className="kv-value"
                    placeholder="ex.: 90"
                    value={row.value}
                    onChange={(e) =>
                      updateRow(setFeatures, idx, "value", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => removeRow(setFeatures, idx)}
                    aria-label="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Tabela Nutricional */}
            <div className="pnew-kv">
              <div className="pnew-kv-head">
                <h3>Tabela nutricional</h3>
                <button
                  type="button"
                  className="btn-small"
                  onClick={() => addRow(setNutrition)}
                >
                  <Plus size={14} /> Adicionar linha
                </button>
              </div>
              {nutrition.map((row, idx) => (
                <div className="pnew-kv-row" key={`n-${idx}`}>
                  <input
                    className="kv-key"
                    placeholder="ex.: kcal"
                    value={row.key}
                    onChange={(e) =>
                      updateRow(setNutrition, idx, "key", e.target.value)
                    }
                  />
                  <input
                    className="kv-value"
                    placeholder="ex.: 210"
                    value={row.value}
                    onChange={(e) =>
                      updateRow(setNutrition, idx, "value", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => removeRow(setNutrition, idx)}
                    aria-label="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pnew-actions">
              <Link to="/app/produtos" className="btn-outline">
                Cancelar
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary"
                type="submit"
                disabled={saving}
              >
                {saving ? "Salvando…" : "Salvar produto"}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.form>
    </div>
  );
}