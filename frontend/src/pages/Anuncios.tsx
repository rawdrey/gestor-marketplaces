import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

interface Anuncio {
  id: number;
  codigo_anuncio?: string;
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
  categoria?: string;
}

interface Produto {
  id: number;
  nome: string;
  sku: string;
}

export function Anuncios() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");

  const [produtoId, setProdutoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [marketplace, setMarketplace] = useState("mercado_livre");
  const [tipoAnuncio, setTipoAnuncio] = useState("classico");
  const [precoVenda, setPrecoVenda] = useState(0);
  const [estoqueAnuncio, setEstoqueAnuncio] = useState(1);

  async function carregarAnuncios() {
    const response = await api.get("/anuncios");
    setAnuncios(response.data);
  }

  async function carregarProdutos() {
    const response = await api.get("/produtos");
    setProdutos(response.data);
  }

  async function cadastrarAnuncio(event: FormEvent) {
    event.preventDefault();

    await api.post("/anuncios", {
      produto_id: Number(produtoId),
      marketplace,
      titulo,
      descricao: "",
      tipo_anuncio: tipoAnuncio,
      preco_venda: precoVenda,
      estoque_anuncio: estoqueAnuncio
    });

    setProdutoId("");
    setTitulo("");
    setPrecoVenda(0);
    setEstoqueAnuncio(1);

    carregarAnuncios();
  }

  async function clonarAnuncio(id: number) {
    await api.post(`/anuncios/${id}/clonar`, {});
    carregarAnuncios();
  }

  useEffect(() => {
    carregarAnuncios();
    carregarProdutos();
  }, []);

  const anunciosFiltrados = anuncios.filter((anuncio) => {
    const texto = busca.toLowerCase();

    return (
      anuncio.titulo?.toLowerCase().includes(texto) ||
      anuncio.sku_interno?.toLowerCase().includes(texto) ||
      anuncio.codigo_anuncio?.toLowerCase().includes(texto)
    );
  });

  const metricas = useMemo(() => {
    const total = anuncios.length;
    const completos = anuncios.filter((a) => Number(a.margem_estimada) > 0).length;
    const incompletos = total - completos;
    const completude = total > 0 ? Math.round((completos / total) * 100) : 0;
    const pendentesSync = anuncios.filter((a) => !a.sincronizado).length;
    const lucroTotalEstimado = anuncios.reduce(
      (soma, a) => soma + Number(a.lucro_estimado || 0),
      0
    );

    return {
      total,
      completos,
      incompletos,
      completude,
      pendentesSync,
      lucroTotalEstimado
    };
  }, [anuncios]);

  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Anúncios</h2>
        <p className="text-gray-500">
          Controle, qualidade, clonagem e desempenho dos anúncios.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Total</p>
          <strong className="text-2xl">{metricas.total}</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Completos</p>
          <strong className="text-2xl text-green-700">{metricas.completos}</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Incompletos</p>
          <strong className="text-2xl text-red-600">{metricas.incompletos}</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Completude</p>
          <strong className="text-2xl">{metricas.completude}%</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Pendente sync</p>
          <strong className="text-2xl text-yellow-600">{metricas.pendentesSync}</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Lucro estimado</p>
          <strong className="text-xl text-green-700">
            {formatarMoeda(metricas.lucroTotalEstimado)}
          </strong>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-bold mb-4">Novo anúncio</h3>

        <form
          onSubmit={cadastrarAnuncio}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <select
            className="border rounded-xl p-3"
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
            required
          >
            <option value="">Selecione produto/SKU</option>

            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.sku} - {produto.nome}
              </option>
            ))}
          </select>

          <input
            className="border rounded-xl p-3"
            placeholder="Título do anúncio"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />

          <select
            className="border rounded-xl p-3"
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
          >
            <option value="mercado_livre">Mercado Livre</option>
            <option value="shopee">Shopee</option>
            <option value="manual">Manual</option>
          </select>

          <select
            className="border rounded-xl p-3"
            value={tipoAnuncio}
            onChange={(e) => setTipoAnuncio(e.target.value)}
          >
            <option value="classico">Clássico</option>
            <option value="premium">Premium</option>
          </select>

          <input
            className="border rounded-xl p-3"
            type="number"
            step="0.01"
            placeholder="Preço de venda"
            value={precoVenda}
            onChange={(e) => setPrecoVenda(Number(e.target.value))}
          />

          <input
            className="border rounded-xl p-3"
            type="number"
            placeholder="Estoque anúncio"
            value={estoqueAnuncio}
            onChange={(e) => setEstoqueAnuncio(Number(e.target.value))}
          />

          <button className="bg-blue-700 text-white rounded-xl p-3 font-bold md:col-span-3">
            Criar anúncio
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-bold mb-4">Exibição de anúncios</h3>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="border rounded-xl p-3 flex-1"
            placeholder="Buscar por título, SKU ou ID"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <button className="border rounded-xl p-3">
            Excel
          </button>

          <button className="border rounded-xl p-3">
            PDF
          </button>

          <button className="border rounded-xl p-3">
            CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-bold mb-2">Central de Qualidade</h3>
        <p className="text-gray-500 mb-4">
          Diagnóstico de completude e rentabilidade dos seus anúncios.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Score geral</p>
            <strong>{metricas.completude}%</strong>
          </div>

          <div>
            <p className="text-gray-500">Anúncios com lucro</p>
            <strong>{metricas.completos}</strong>
          </div>

          <div>
            <p className="text-gray-500">A revisar</p>
            <strong>{metricas.incompletos}</strong>
          </div>

          <div>
            <p className="text-gray-500">Pendente sincronização</p>
            <strong>{metricas.pendentesSync}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {anunciosFiltrados.map((anuncio) => {
          const lucroPositivo = Number(anuncio.lucro_estimado) >= 0;
          const score = Math.max(
            0,
            Math.min(100, Math.round(Number(anuncio.margem_estimada || 0)))
          );

          return (
            <div key={anuncio.id} className="bg-white rounded-2xl shadow p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {anuncio.codigo_anuncio || "Sem ID marketplace"}
                    </p>

                    <h3 className="font-bold text-lg">
                      {anuncio.titulo}
                    </h3>

                    <p className="text-gray-500">
                      SKU: {anuncio.sku_interno} | {anuncio.produto_nome}
                    </p>
                  </div>

                  <button
                    onClick={() => clonarAnuncio(anuncio.id)}
                    className="bg-gray-900 text-white px-4 py-3 rounded-xl font-bold"
                  >
                    Clonar anúncio
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-8 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Marketplace</p>
                    <strong>{anuncio.marketplace}</strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Tipo</p>
                    <strong>{anuncio.tipo_anuncio}</strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Estoque</p>
                    <strong>{anuncio.estoque_anuncio}</strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Preço</p>
                    <strong>{formatarMoeda(anuncio.preco_venda)}</strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Lucro</p>
                    <strong className={lucroPositivo ? "text-green-700" : "text-red-600"}>
                      {formatarMoeda(anuncio.lucro_estimado)}
                    </strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Margem</p>
                    <strong>{Number(anuncio.margem_estimada || 0).toFixed(2)}%</strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Score</p>
                    <strong>{score}%</strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Status</p>
                    <strong>{anuncio.status}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-gray-100 px-3 py-2 rounded-xl">
                    {anuncio.sincronizado ? "Sincronizado" : "Pendente sync"}
                  </span>

                  <span className="bg-gray-100 px-3 py-2 rounded-xl">
                    {lucroPositivo ? "Rentável" : "Revisar preço"}
                  </span>

                  <span className="bg-gray-100 px-3 py-2 rounded-xl">
                    {score >= 70 ? "Qualidade boa" : "Qualidade baixa"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {anunciosFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Nenhum anúncio encontrado.
          </div>
        )}
      </div>
    </div>
  );
}