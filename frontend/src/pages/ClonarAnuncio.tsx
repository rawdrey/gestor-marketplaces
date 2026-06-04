import { FormEvent, useState } from "react";
import { api } from "../services/api";

interface AnuncioMl {
  id: string;
  title: string;
  price: number;
  available_quantity: number;
  category_id: string;
  currency_id: string;
  condition: string;
  listing_type_id: string;
  buying_mode: string;
  pictures: any[];
  attributes: any[];
  description: string;
  permalink: string;
}

export function ClonarAnuncio() {
  const [termo, setTermo] = useState("");
  const [anuncio, setAnuncio] = useState<AnuncioMl | null>(null);
  const [mensagem, setMensagem] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState(0);
  const [estoque, setEstoque] = useState(1);
  const [tipoAnuncio, setTipoAnuncio] = useState("gold_special");
  const [clonarPausado, setClonarPausado] = useState(true);

  async function pesquisar(event: FormEvent) {
    event.preventDefault();
    setMensagem("");

    try {
      const response = await api.get("/mercado-livre/clonar/buscar", {
        params: {
          termo
        }
      });

      const item = response.data;

      setAnuncio(item);
      setTitulo(item.title || "");
      setDescricao(item.description || "");
      setPreco(Number(item.price || 0));
      setEstoque(Number(item.available_quantity || 1));
      setTipoAnuncio(item.listing_type_id || "gold_special");
    } catch (error: any) {
      setMensagem(
        error.response?.data?.mensagem || "Erro ao buscar anúncio"
      );
      setAnuncio(null);
    }
  }

  async function clonar() {
    if (!anuncio) return;

    try {
      setMensagem("Clonando anúncio no Mercado Livre...");

      const response = await api.post("/mercado-livre/clonar/publicar", {
        anuncio_origem_id: anuncio.id,
        title: titulo,
        description: descricao,
        price: preco,
        available_quantity: estoque,
        category_id: anuncio.category_id,
        currency_id: anuncio.currency_id,
        condition: anuncio.condition,
        listing_type_id: tipoAnuncio,
        buying_mode: anuncio.buying_mode,
        pictures: anuncio.pictures,
        attributes: anuncio.attributes,
        status: clonarPausado ? "pausado" : "ativo"
      });

      setMensagem(
        `Anúncio clonado com sucesso: ${response.data.mercado_livre.id}`
      );
    } catch (error: any) {
      setMensagem(
        error.response?.data?.mensagem || "Erro ao clonar anúncio"
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Clonar anúncio Mercado Livre</h2>
        <p className="text-gray-500">
          Cole um link ou número MLB, revise os dados e publique um clone.
        </p>
      </div>

      {mensagem && (
        <div className="bg-white rounded-2xl shadow p-4">
          {mensagem}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-4">
        <form
          onSubmit={pesquisar}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <input
            className="border rounded-xl p-3 md:col-span-3"
            placeholder="Cole o link ou MLB. Ex: MLB6434072634"
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
          <div>
            <p className="text-sm text-gray-500">{anuncio.id}</p>
            <h3 className="text-xl font-bold">{anuncio.title}</h3>
            <p className="text-gray-500">
              Categoria: {anuncio.category_id} | Tipo:{" "}
              {anuncio.listing_type_id}
            </p>

            {anuncio.permalink && (
              <a
                href={anuncio.permalink}
                target="_blank"
                className="text-blue-700 font-medium"
              >
                Abrir anúncio original
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {anuncio.pictures?.slice(0, 6).map((foto: any, index: number) => (
              <img
                key={index}
                src={foto.secure_url || foto.url}
                className="w-full h-28 object-cover rounded-xl border"
              />
            ))}
          </div>

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
              className="border rounded-xl p-3 w-full min-h-40"
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
                value={preco}
                onChange={(e) => setPreco(Number(e.target.value))}
              />
            </label>

            <label>
              <span className="block mb-1 font-medium">Estoque</span>
              <input
                className="border rounded-xl p-3 w-full"
                type="number"
                value={estoque}
                onChange={(e) => setEstoque(Number(e.target.value))}
              />
            </label>

            <label>
              <span className="block mb-1 font-medium">Tipo de anúncio</span>
              <select
                className="border rounded-xl p-3 w-full"
                value={tipoAnuncio}
                onChange={(e) => setTipoAnuncio(e.target.value)}
              >
                <option value="gold_special">Clássico</option>
                <option value="gold_pro">Premium</option>
              </select>
            </label>
          </div>

          <label className="flex items-start gap-3 bg-gray-100 rounded-xl p-4">
            <input
              type="checkbox"
              checked={clonarPausado}
              onChange={(e) => setClonarPausado(e.target.checked)}
              className="mt-1"
            />

            <span>
              <strong className="block">Clonar como pausado</strong>
              <span className="text-gray-600 text-sm">
                Recomendado para revisar o anúncio no Mercado Livre antes de
                ativar.
              </span>
            </span>
          </label>

          <button
            onClick={clonar}
            className="bg-green-700 text-white rounded-xl p-4 font-bold text-lg w-full"
          >
            Clonar anúncio selecionado
          </button>
        </div>
      )}
    </div>
  );
}