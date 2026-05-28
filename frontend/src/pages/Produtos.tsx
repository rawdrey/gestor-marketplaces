import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";

interface Produto {
  id: number;
  sku: string;
  nome: string;
  estoque_atual: number;
  estoque_minimo: number;
  custo_medio: number;
  preco_entrada: number;
}

export function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");

  const [sku, setSku] = useState("");
  const [nome, setNome] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState(1);

  async function carregarProdutos() {
    try {
      const response = await api.get("/produtos");
      setProdutos(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function cadastrarProduto(event: FormEvent) {
    event.preventDefault();

    try {
      await api.post("/produtos", {
        sku,
        nome,
        descricao: "",
        preco_entrada: 0,
        estoque_atual: 0,
        estoque_minimo: estoqueMinimo
      });

      setSku("");
      setNome("");
      setEstoqueMinimo(1);

      carregarProdutos();
    } catch (error) {
      console.log(error);
      alert("Erro ao cadastrar produto");
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const produtosFiltrados = produtos.filter((produto) => {
    const texto = busca.toLowerCase();

    return (
      produto.sku.toLowerCase().includes(texto) ||
      produto.nome.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Produtos / SKU</h2>
        <p className="text-gray-500">
          Controle central de estoque e custo médio.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-bold mb-4">Cadastrar produto</h3>

        <form
          onSubmit={cadastrarProduto}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <input
            className="border rounded-xl p-3"
            placeholder="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />

          <input
            className="border rounded-xl p-3"
            placeholder="Nome produto"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            className="border rounded-xl p-3"
            type="number"
            placeholder="Estoque mínimo"
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
          />

          <button className="bg-blue-700 text-white rounded-xl p-3 font-bold">
            Salvar
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <input
          className="border rounded-xl p-3 w-full"
          placeholder="Buscar SKU ou produto"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {produtosFiltrados.map((produto) => {
          const estoqueBaixo =
            produto.estoque_atual <= produto.estoque_minimo;

          return (
            <div
              key={produto.id}
              className="bg-white rounded-2xl shadow p-4"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">{produto.nome}</h3>

                  <p className="text-gray-500">
                    SKU: {produto.sku}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Estoque</p>

                    <strong
                      className={
                        estoqueBaixo
                          ? "text-red-600"
                          : "text-green-700"
                      }
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

                    <strong>
                      R$ {Number(produto.custo_medio || 0).toFixed(2)}
                    </strong>
                  </div>

                  <div>
                    <p className="text-gray-500">Última compra</p>

                    <strong>
                      R$ {Number(produto.preco_entrada || 0).toFixed(2)}
                    </strong>
                  </div>
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