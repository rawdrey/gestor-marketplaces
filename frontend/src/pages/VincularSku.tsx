import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

interface AnuncioPendente {
  id: number;
  codigo_anuncio?: string;
  titulo: string;
  sku_marketplace?: string;
  preco_venda: number;
  estoque_anuncio: number;
  status: string;
  marketplace: string;
  conta_nickname?: string;
  nome_conta?: string;
  vinculo_sku_status?: string;
}

interface Produto {
  id: number;
  sku: string;
  nome: string;
  estoque_atual: number;
  custo_medio: number;
}

export function VincularSku() {
  const [anuncios, setAnuncios] = useState<AnuncioPendente[]>([]);
  const [busca, setBusca] = useState("");
  const [termoProduto, setTermoProduto] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [anuncioSelecionado, setAnuncioSelecionado] =
    useState<AnuncioPendente | null>(null);
  const [mensagem, setMensagem] = useState("");

  async function carregarPendentes() {
    const response = await api.get("/anuncios/pendentes-sku");
    setAnuncios(response.data);
  }

  async function buscarProdutos(event?: FormEvent) {
    event?.preventDefault();

    const response = await api.get("/produtos/buscar", {
      params: {
        termo: termoProduto
      }
    });

    setProdutos(response.data);
  }

  async function vincularProduto(produto: Produto) {
    if (!anuncioSelecionado) return;

    await api.put(`/anuncios/${anuncioSelecionado.id}/vincular-sku`, {
      sku: produto.sku
    });

    setMensagem(`SKU ${produto.sku} vinculado com sucesso.`);
    setAnuncioSelecionado(null);
    setProdutos([]);
    setTermoProduto("");
    carregarPendentes();
  }

  async function vincularAutomaticamente() {
    const response = await api.post("/anuncios/vincular-automaticamente");

    setMensagem(
      `Automático concluído. Analisados: ${response.data.total_analisados}. Vinculados: ${response.data.vinculados}. Não encontrados: ${response.data.nao_encontrados}.`
    );

    carregarPendentes();
  }

  useEffect(() => {
    carregarPendentes();
  }, []);

  const anunciosFiltrados = anuncios.filter((anuncio) => {
    const texto = busca.toLowerCase();

    return (
      anuncio.titulo?.toLowerCase().includes(texto) ||
      anuncio.codigo_anuncio?.toLowerCase().includes(texto) ||
      anuncio.sku_marketplace?.toLowerCase().includes(texto)
    );
  });

  const metricas = useMemo(() => {
    const total = anuncios.length;
    const semSkuMl = anuncios.filter((a) => !a.sku_marketplace).length;
    const comSkuMl = total - semSkuMl;

    return {
      total,
      semSkuMl,
      comSkuMl
    };
  }, [anuncios]);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Vincular SKU</h2>
        <p className="text-gray-500">
          Resolva anúncios importados do Mercado Livre que ainda não estão ligados ao estoque central.
        </p>
      </div>

      {mensagem && (
        <div className="bg-white rounded-2xl shadow p-4">
          {mensagem}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Pendentes</p>
          <strong className="text-3xl">{metricas.total}</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Com SKU ML</p>
          <strong className="text-3xl text-green-700">
            {metricas.comSkuMl}
          </strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Sem SKU ML</p>
          <strong className="text-3xl text-red-600">
            {metricas.semSkuMl}
          </strong>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 flex flex-col md:flex-row gap-3">
        <input
          className="border rounded-xl p-3 flex-1"
          placeholder="Buscar por MLB, título ou SKU ML"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <button
          onClick={vincularAutomaticamente}
          className="bg-blue-700 text-white rounded-xl p-3 font-bold"
        >
          Vincular automaticamente
        </button>
      </div>

      {anuncioSelecionado && (
        <div className="bg-gray-900 text-white rounded-3xl shadow p-5 space-y-4">
          <div>
            <p className="text-gray-300">Anúncio selecionado</p>
            <h3 className="text-xl font-bold">{anuncioSelecionado.titulo}</h3>
            <p className="text-gray-300">
              {anuncioSelecionado.codigo_anuncio || "Sem MLB"} | SKU ML:{" "}
              {anuncioSelecionado.sku_marketplace || "vazio"}
            </p>
          </div>

          <form onSubmit={buscarProdutos} className="flex flex-col md:flex-row gap-3">
            <input
              className="border rounded-xl p-3 flex-1 text-gray-900"
              placeholder="Pesquisar SKU ou produto"
              value={termoProduto}
              onChange={(e) => setTermoProduto(e.target.value)}
            />

            <button className="bg-yellow-400 text-gray-900 rounded-xl p-3 font-bold">
              Buscar SKU
            </button>
          </form>

          <div className="grid grid-cols-1 gap-3">
            {produtos.map((produto) => (
              <button
                key={produto.id}
                onClick={() => vincularProduto(produto)}
                className="bg-white text-gray-900 rounded-xl p-4 text-left"
              >
                <strong>{produto.sku}</strong>
                <p>{produto.nome}</p>
                <p className="text-sm text-gray-500">
                  Estoque: {produto.estoque_atual} | Custo médio:{" "}
                  {moeda(produto.custo_medio)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {anunciosFiltrados.map((anuncio) => (
          <div key={anuncio.id} className="bg-white rounded-2xl shadow p-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  {anuncio.codigo_anuncio || "Sem código MLB"}
                </p>

                <h3 className="font-bold text-lg">{anuncio.titulo}</h3>

                <p className="text-gray-500">
                  SKU ML: {anuncio.sku_marketplace || "vazio"}
                </p>

                <p className="text-gray-500">
                  Conta:{" "}
                  {anuncio.nome_conta ||
                    anuncio.conta_nickname ||
                    "Sem conta vinculada"}
                </p>
              </div>

              <button
                onClick={() => {
                  setAnuncioSelecionado(anuncio);
                  setTermoProduto(anuncio.sku_marketplace || "");
                }}
                className="bg-gray-900 text-white px-4 py-3 rounded-xl font-bold"
              >
                Selecionar SKU
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-4">
              <div>
                <p className="text-gray-500">Preço</p>
                <strong>{moeda(anuncio.preco_venda)}</strong>
              </div>

              <div>
                <p className="text-gray-500">Estoque</p>
                <strong>{anuncio.estoque_anuncio}</strong>
              </div>

              <div>
                <p className="text-gray-500">Status</p>
                <strong>{anuncio.status}</strong>
              </div>

              <div>
                <p className="text-gray-500">Marketplace</p>
                <strong>{anuncio.marketplace}</strong>
              </div>
            </div>
          </div>
        ))}

        {anunciosFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Nenhum anúncio pendente.
          </div>
        )}
      </div>
    </div>
  );
}