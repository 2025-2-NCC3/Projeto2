import { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
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
  const [costEstimated, setCostEstimated] = useState("");

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

    // ✅ PREÇO OPCIONAL: Se informado, valida; se vazio, fica null
    const priceNumber = price ? Number(String(price).replace(",", ".")) : null;
    if (price && (!priceNumber || priceNumber <= 0))
      return notify({
        type: "error",
        title: "Preço inválido",
        message: "Informe um preço válido (ex.: 7.50) ou deixe em branco.",
      });

    // ✅ CUSTO OPCIONAL: Se informado, valida; se vazio, fica null
    const costNumber = costEstimated ? Number(String(costEstimated).replace(",", ".")) : null;
    if (costEstimated && Number.isNaN(costNumber))
      return notify({
        type: "error",
        title: "Custo inválido",
        message: "Custo estimado deve ser numérico ou deixe em branco.",
      });

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

      // ✅ APENAS SALVAR NA TABELA PRODUCTS (NÃO SALVA EM PRODUCT_PRICES)
      const { data: prod, error: pErr } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          slug: finalSlug,
          description: description || null,
          image_url: finalImageUrl || null,
          features: featuresObj,
          nutrition: nutritionObj,
          is_active: true,
          cost_estimated: costNumber, // ✅ Pode ser null
        })
        .select("id, slug")
        .single();
        
      if (pErr) {
        notify({
          type: "error",
          title: "Erro ao salvar produto",
          message: pErr.message,
        });
        setSaving(false);
        return;
      }

      // ✅ NÃO SALVA MAIS EM PRODUCT_PRICES - Produto normal do catálogo
      
      notify({
        type: "success",
        title: "Produto cadastrado",
        message: priceNumber 
          ? "Produto criado com preço definido!" 
          : "Produto criado! Defina o preço depois.",
      });
      
      setTimeout(() => navigate("/app/produtos", { replace: true }), 700);
    } catch (err) {
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

            {/* ✅ PREÇO E CUSTO OPCIONAIS */}
            <div className="pnew-row">
              <label className="pnew-label">
                <span>Preço (R$) - Opcional</span>
                <input
                  inputMode="decimal"
                  placeholder="deixe em branco para definir depois"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <small>Preço de venda ao público</small>
              </label>
              <label className="pnew-label">
                <span>Custo estimado (R$) - Opcional</span>
                <input
                  inputMode="decimal"
                  placeholder="deixe em branco se não souber"
                  value={costEstimated}
                  onChange={(e) => setCostEstimated(e.target.value)}
                />
                <small>Para controle interno</small>
              </label>
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