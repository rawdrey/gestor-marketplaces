import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";

interface Anuncio {
  id: number;
  titulo: string;
  marketplace: string;
  tipo_anuncio: string;
  preco_venda: number;
  estoque_anuncio: number;
  lucro_estimado: number;
  margem_estimada: number;
  sincronizado: boolean;
  status: string;
  sku_interno: string;
  produto_nome: string;
}

interface Produto {
  id: number;
  nome: string;
  sku: string;
}

export function Anuncios() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [produtoId, setProdutoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [marketplace, setMarketplace] = useState("mercado_livre");
  const [tipoAnuncio, setTipoAnuncio] = useState("classico");
  const [precoVenda, setPrecoVenda] = useState(0);
  const [estoqueAnuncio, setEstoqueAnuncio] = useState(1);

  async function carregarAnuncios() {
    try {
      const response = await api.get("/anuncios");
      setAnuncios(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function carregarProdutos() {
    try {
      const response = await api.get("/produtos");
      setProdutos(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function cadastrarAnuncio(event: FormEvent) {
    event.preventDefault();

    try {
      await api.post("/anuncios", {
        produto_id: Number(produtoId),
        marketplace,
        titulo,
        descricao: "",
        tipo_anuncio: tipoAnuncio,
        preco_venda: precoVenda,
        estoque_anuncio: estoqueAnuncio
      });

      setTitulo("");
      setPrecoVenda(0);
      setEstoqueAnuncio(1);

      carregarAnuncios();
    } catch (error) {
      console.log(error);
      alert("Erro ao criar anúncio");
    }
  }

  async function clonarAnuncio(id: number) {
    try {
      await api.post(`/anuncios/${id}/clonar`, {});

      carregarAnuncios();
    } catch (error) {
      console.log(error);
      alert("Erro ao clonar anúncio");
    }
  }

  useEffect(() => {
    carregarAnuncios();
    carregarProdutos();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Anúncios
        </h2>

        <p className="text-gray-500">
          Gestão de anúncios vinculados ao estoque central.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <form
          onSubmit={cadastrarAnuncio}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <select
            className="border rounded-xl p-3"
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
          >
            <option value="">Selecione produto</option>

            {produtos.map((produto) => (
              <option
                key={produto.id}
                value={produto.id}
              >
                {produto.sku} - {produto.nome}
              </option>
            ))}
          </select>

          <input
            className="border rounded-xl p-3"
            placeholder="Título anúncio"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <select
            className="border rounded-xl p-3"
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
          >
            <option value="mercado_livre">
              Mercado Livre
            </option>

            <option value="shopee">
              Shopee
            </option>
          </select>

          <select
            className="border rounded-xl p-3"
            value={tipoAnuncio}
            onChange={(e) => setTipoAnuncio(e.target.value)}
          >
            <option value="classico">
              Clássico
            </option>

            <option value="premium">
              Premium
            </option>
          </select>

          <input
            className="border rounded-xl p-3"
            type="number"
            step="0.01"
            placeholder="Preço venda"
            value={precoVenda}
            onChange={(e) =>
              setPrecoVenda(Number(e.target.value))
            }
          />

          <input
            className="border rounded-xl p-3"
            type="number"
            placeholder="Estoque anúncio"
            value={estoqueAnuncio}
            onChange={(e) =>
              setEstoqueAnuncio(Number(e.target.value))
            }
          />

          <button className="bg-blue-700 text-white rounded-xl p-3 font-bold md:col-span-3">
            Criar anúncio
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {anuncios.map((anuncio) => (
          <div
            key={anuncio.id}
            className="bg-white rounded-2xl shadow p-4"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">
                    {anuncio.titulo}
                  </h3>

                  <p className="text-gray-500">
                    {anuncio.sku_interno}
                  </p>
                </div>

                <button
                  onClick={() =>
                    clonarAnuncio(anuncio.id)
                  }
                  className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm"
                >
                  Clonar
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">
                    Marketplace
                  </p>

                  <strong>
                    {anuncio.marketplace}
                  </strong>
                </div>

                <div>
                  <p className="text-gray-500">
                    Tipo
                  </p>

                  <strong>
                    {anuncio.tipo_anuncio}
                  </strong>
                </div>

                <div>
                  <p className="text-gray-500">
                    Preço
                  </p>

                  <strong>
                    R${" "}
                    {Number(
                      anuncio.preco_venda
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <p className="text-gray-500">
                    Estoque
                  </p>

                  <strong>
                    {anuncio.estoque_anuncio}
                  </strong>
                </div>

                <div>
                  <p className="text-gray-500">
                    Lucro
                  </p>

                  <strong className="text-green-700">
                    R${" "}
                    {Number(
                      anuncio.lucro_estimado
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <p className="text-gray-500">
                    Margem
                  </p>

                  <strong>
                    {Number(
                      anuncio.margem_estimada
                    ).toFixed(2)}
                    %
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span
                  className={
                    anuncio.sincronizado
                      ? "text-green-700"
                      : "text-yellow-600"
                  }
                >
                  {anuncio.sincronizado
                    ? "Sincronizado"
                    : "Pendente sync"}
                </span>

                <span className="text-gray-400">
                  •
                </span>

                <span>{anuncio.status}</span>
              </div>
            </div>
          </div>
        ))}

        {anuncios.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Nenhum anúncio encontrado.
          </div>
        )}
      </div>
    </div>
  );
}