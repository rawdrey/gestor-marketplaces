import { FormEvent, useState } from "react";
import { api } from "../services/api";

interface AnuncioEncontrado {
  id: number;
  codigo_anuncio: string;
  titulo: string;
  descricao: string;
  marketplace: string;
  tipo_anuncio: string;
  preco_venda: number;
  estoque_anuncio: number;
  sku_interno: string;
  produto_nome: string;
}

export function ClonarAnuncio() {
  const [termo, setTermo] = useState("");
  const [anuncio, setAnuncio] = useState<AnuncioEncontrado | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [precoVenda, setPrecoVenda] = useState(0);
  const [estoque, setEstoque] = useState(1);
  const [tipoAnuncio, setTipoAnuncio] = useState("classico");
  const [clonarPausado, setClonarPausado] = useState(true);

  async function pesquisar(event: FormEvent) {
    event.preventDefault();

    try {
      const response = await api.get("/anuncios/buscar-para-clonar", {
        params: {
          termo
        }
      });

      const item = response.data;

      setAnuncio(item);
      setTitulo(item.titulo);
      setDescricao(item.descricao || "");
      setPrecoVenda(Number(item.preco_venda || 0));
      setEstoque(Number(item.estoque_anuncio || 1));
      setTipoAnuncio(item.tipo_anuncio || "classico");
    } catch {
      alert("Anúncio não encontrado");
      setAnuncio(null);
    }
  }

  async function clonar() {
    if (!anuncio) return;

    try {
      await api.post(`/anuncios/${anuncio.id}/clonar`, {
        titulo,
        descricao,
        preco_venda: precoVenda,
        estoque_anuncio: estoque,
        tipo_anuncio: tipoAnuncio,
        status: clonarPausado ? "pausado" : "rascunho"
      });

      alert("Anúncio clonado com sucesso");
    } catch {
      alert("Erro ao clonar anúncio");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Clonar anúncio</h2>
        <p className="text-gray-500">
          Cole o link ou número MLB do anúncio para buscar e clonar.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <form onSubmit={pesquisar} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            className="border rounded-xl p-3 md:col-span-3"
            placeholder="Cole o link ou número do anúncio. Ex: MLB6434072634"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            required
          />

          <button className="bg-blue-700 text-white rounded-xl p-3 font-bold">
            Pesquisar
          </button>
        </form>
      </div>

      {anuncio && (
        <div className="bg-white rounded-2xl shadow p-4 space-y-5">
          <div className="border-b pb-4">
            <p className="text-gray-500 text-sm">
              {anuncio.codigo_anuncio || "Sem código Mercado Livre"}
            </p>

            <h3 className="text-xl font-bold">{anuncio.titulo}</h3>

            <p className="text-gray-500">
              SKU: {anuncio.sku_interno} | {anuncio.produto_nome}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <label>
              <span className="block mb-1 font-medium">Título</span>
              <input
                className="border rounded-xl p-3 w-full"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </label>

            <label>
              <span className="block mb-1 font-medium">Descrição</span>
              <textarea
                className="border rounded-xl p-3 w-full min-h-32"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label>
                <span className="block mb-1 font-medium">Preço</span>
                <input
                  className="border rounded-xl p-3 w-full"
                  type="number"
                  step="0.01"
                  value={precoVenda}
                  onChange={(e) => setPrecoVenda(Number(e.target.value))}
                />
              </label>

              <label>
                <span className="block mb-1 font-medium">Quantidade estoque</span>
                <input
                  className="border rounded-xl p-3 w-full"
                  type="number"
                  value={estoque}
                  onChange={(e) => setEstoque(Number(e.target.value))}
                />
              </label>

              <label>
                <span className="block mb-1 font-medium">Tipo anúncio</span>
                <select
                  className="border rounded-xl p-3 w-full"
                  value={tipoAnuncio}
                  onChange={(e) => setTipoAnuncio(e.target.value)}
                >
                  <option value="classico">Clássico</option>
                  <option value="premium">Premium</option>
                </select>
              </label>
            </div>

            <label className="flex items-center gap-3 bg-gray-100 rounded-xl p-4">
              <input
                type="checkbox"
                checked={clonarPausado}
                onChange={(e) => setClonarPausado(e.target.checked)}
              />

              <span>Clonar como pausado</span>
            </label>

            <button
              onClick={clonar}
              className="bg-green-700 text-white rounded-xl p-4 font-bold text-lg"
            >
              Clonar anúncio selecionado
            </button>
          </div>
        </div>
      )}
    </div>
  );
}