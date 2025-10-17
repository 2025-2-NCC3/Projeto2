import { useMemo, useState } from "react";
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
  const [imageFile, setImageFile] = useState(null);
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

  function onImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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

    const priceNumber = Number(String(price).replace(",", "."));
    if (!priceNumber || priceNumber <= 0)
      return notify({
        type: "error",
        title: "Preço inválido",
        message: "Informe um preço válido (ex.: 7.50).",
      });

    const costNumber = costEstimated
      ? Number(String(costEstimated).replace(",", "."))
      : 0;
    if (Number.isNaN(costNumber))
      return notify({
        type: "error",
        title: "Custo inválido",
        message: "Custo estimado deve ser numérico.",
      });

    const featuresObj = pairsToObject(features);
    const nutritionObj = pairsToObject(nutrition);

    setSaving(true);
    try {
      // 1) Upload da imagem (se houver)
      let image_url = null;
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

        // URL pública (bucket público)
        const { data: pub } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);
        image_url = pub?.publicUrl || null;
      }

      // 2) Inserir produto
      const { data: prod, error: pErr } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          slug: finalSlug,
          description: description || null,
          image_url,
          features: featuresObj,
          nutrition: nutritionObj,
          is_active: true,
          // 👇 se custo não informado, usa o preço para "aparecer na tabela"
          cost_estimated:
            !Number.isNaN(costNumber) && costNumber > 0 ? costNumber : priceNumber,
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

      // 3) Inserir preço vigente (histórico de preços)
      const { error: priceErr } = await supabase.from("product_prices").insert({
        product_id: prod.id,
        price: priceNumber,
      });
      if (priceErr) {
        notify({
          type: "warning",
          title: "Produto salvo, mas…",
          message:
            "Falha ao registrar preço. Abra o produto e cadastre o preço.",
        });
        setSaving(false);
        return;
      }

      notify({
        type: "success",
        title: "Produto cadastrado",
        message: "O produto foi criado com sucesso!",
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
          {/* Imagem */}
          <div className="pnew-imagecol">
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

            <label className="pnew-upload">
              <UploadCloud />
              <span>Selecionar imagem</span>
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                hidden
              />
            </label>

            <p className="pnew-help">Formatos: JPG/PNG/WebP. Ideal ~1000px.</p>
          </div>

          {/* Dados */}
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

            <div className="pnew-row">
              <label className="pnew-label">
                <span>Preço (R$)</span>
                <input
                  inputMode="decimal"
                  placeholder="7.50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>
              <label className="pnew-label">
                <span>Custo estimado (R$)</span>
                <input
                  inputMode="decimal"
                  placeholder="opcional"
                  value={costEstimated}
                  onChange={(e) => setCostEstimated(e.target.value)}
                />
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
