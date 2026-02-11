import { useState } from "react";

export function usePixabaySearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function searchPixabay(term) {
    if (!term || !term.trim()) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const API_KEY = import.meta.env.VITE_PIXABAY_KEY;
      const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(
        term
      )}&image_type=photo&lang=pt&per_page=24&safesearch=true`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.hits) {
        setResults([]);
        return;
      }

      // normalizamos o formato
      const mapped = data.hits.map((hit) => ({
        id: hit.id,
        previewURL: hit.previewURL,
        largeImageURL: hit.largeImageURL,
        tags: hit.tags,
        author: hit.user,
        source: "pixabay",
      }));

      setResults(mapped);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao buscar imagens. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return { results, loading, errorMsg, searchPixabay };
}
