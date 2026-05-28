import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

interface Produto {
  id: number;
  sku: string;
  nome: string;
  estoque_atual: number;
  estoque_minimo: number;
  custo_medio: number;
  preco_entrada: number;
  categoria?: string;
  marca?: string;
  tipo_produto?: string;
}

export function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");

  const [sku, setSku] = useState("");
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [marca, setMarca] = useState("");
  const [tipoProduto, setTipoProduto] = useState("simples");
  const [estoqueMinimo, setEstoqueMinimo] = useState(1);

  async function carregarProdutos() {
    const response = await api.get("/produtos");
    setProdutos(response.data);
  }

  async function cadastrarProduto(event: FormEvent) {
    event.preventDefault();

    await api.post("/produtos", {
      sku,
      nome,
      descricao: "",
      preco_entrada: 0,
      estoque_atual: 0,
      estoque_minimo: estoqueMinimo,
      categoria,
      marca,
      tipo_produto: tipoProduto
    });

    setSku("");
    setNome("");
    setCategoria("");
    setMarca("");
    setTipoProduto("simples");
    setEstoqueMinimo(1);

    carregarProdutos();
  }

  async function desativarProduto(id: number) {
    const confirmar = confirm("Deseja desativar este produto?");

    if (!confirmar) return;

    await api.delete(`/produtos/${id}`);
    carregarProdutos();
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const produtosFiltrados = produtos.filter((produto) => {
    const texto = busca.toLowerCase();

    return (
      produto.sku?.toLowerCase().includes(texto) ||
      produto.nome?.toLowerCase().includes(texto) ||
      produto.categoria?.toLowerCase().includes(texto) ||
      produto.marca?.toLowerCase().includes(texto)
    );
  });

  const metricas = useMemo(() => {
    const total = produtos.length;

    const estoqueBaixo = produtos.filter(
      (p) => Number(p.estoque_atual) <= Number(p.estoque_minimo)
    ).length;

    const totalEstoque = produtos.reduce(
      (soma, p) => soma + Number(p.estoque_atual || 0),
      0
    );

    const valorEstoque = produtos.reduce(
      (soma, p) =>
        soma + Number(p.estoque_atual || 0) * Number(p.custo_medio || 0),
      0
    );

    const kits = produtos.filter((p) => p.tipo_produto === "kit").length;

    return {
      total,
      estoqueBaixo,
      totalEstoque,
      valorEstoque,
      kits
    };
  }, [produtos]);

  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Produtos / SKUs</h2>
        <p className="text-gray-500">
          Estoque central, custo médio, kits e controle por SKU.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Produtos</p>
          <strong className="text-2xl">{metricas.total}</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Estoque total</p>
          <strong className="text-2xl">{metricas.totalEstoque}</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Estoque baixo</p>
          <strong className="text-2xl text-red-600">
            {metricas.estoqueBaixo}
          </strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Valor estoque</p>
          <strong className="text-xl text-green-700">
            {formatarMoeda(metricas.valorEstoque)}
          </strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Kits</p>
          <strong className="text-2xl">{metricas.kits}</strong>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-bold mb-4">Cadastrar produto/SKU</h3>

        <form
          onSubmit={cadastrarProduto}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            className="border rounded-xl p-3"
            placeholder="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
          />

          <input
            className="border rounded-xl p-3"
            placeholder="Nome do produto"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <select
            className="border rounded-xl p-3"
            value={tipoProduto}
            onChange={(e) => setTipoProduto(e.target.value)}
          >
            <option value="simples">Produto simples</option>
            <option value="kit">Kit</option>
          </select>

          <input
            className="border rounded-xl p-3"
            placeholder="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />

          <input
            className="border rounded-xl p-3"
            placeholder="Marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
          />

          <input
            className="border rounded-xl p-3"
            type="number"
            placeholder="Estoque mínimo"
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
          />

          <button className="bg-blue-700 text-white rounded-xl p-3 font-bold md:col-span-3">
            Salvar produto
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <input
          className="border rounded-xl p-3 w-full"
          placeholder="Buscar por SKU, produto, categoria ou marca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {produtosFiltrados.map((produto) => {
          const estoqueBaixo =
            Number(produto.estoque_atual) <= Number(produto.estoque_minimo);

          const valorEstoque =
            Number(produto.estoque_atual || 0) *
            Number(produto.custo_medio || 0);

          return (
            <div key={produto.id} className="bg-white rounded-2xl shadow p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      SKU: {produto.sku}
                    </p>

                    <h3 className="font-bold text-lg">{produto.nome}</h3>

                    <p className="text-gray-500">
                      {produto.categoria || "Sem categoria"} |{" "}
                      {produto.marca || "Sem marca"}
                    </p>
                  </div>

                  <button
                    onClick={() => desativarProduto(produto.id)}
                    className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold"
                  >
                    Desativar
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Tipo</p>
                    <strong>{produto.tipo_produto || "simples"}</strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Estoque</p>
                    <strong
                      className={estoqueBaixo ? "text-red-600" : "text-green-700"}
                    >
                      {produto.estoque_atual}
                    </strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Mínimo</p>
                    <strong>{produto.estoque_minimo}</strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Custo médio</p>
                    <strong>{formatarMoeda(produto.custo_medio)}</strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Última compra</p>
                    <strong>{formatarMoeda(produto.preco_entrada)}</strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Valor estoque</p>
                    <strong>{formatarMoeda(valorEstoque)}</strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Status</p>
                    <strong>{estoqueBaixo ? "Repor" : "OK"}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-gray-100 px-3 py-2 rounded-xl">
                    {estoqueBaixo ? "Estoque baixo" : "Estoque saudável"}
                  </span>

                  <span className="bg-gray-100 px-3 py-2 rounded-xl">
                    {produto.tipo_produto === "kit"
                      ? "Produto composto"
                      : "Produto simples"}
                  </span>

                  <span className="bg-gray-100 px-3 py-2 rounded-xl">
                    Valor em estoque: {formatarMoeda(valorEstoque)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {produtosFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Nenhum produto encontrado.
          </div>
        )}
      </div>
    </div>
  );
}