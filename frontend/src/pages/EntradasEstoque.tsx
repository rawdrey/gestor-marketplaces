import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";

interface Entrada {
  id: number;
  sku: string;
  produto_nome: string;
  quantidade: number;
  custo_unitario: number;
  custo_total: number;
  estoque_anterior: number;
  estoque_novo: number;
  custo_medio_anterior: number;
  custo_medio_novo: number;
  criado_em: string;
}

export function EntradasEstoque() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);

  const [sku, setSku] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [custoUnitario, setCustoUnitario] = useState(0);

  async function carregarEntradas() {
    try {
      const response = await api.get("/entradas-estoque");
      setEntradas(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function registrarEntrada(event: FormEvent) {
    event.preventDefault();

    try {
      await api.post("/entradas-estoque", {
        sku,
        quantidade,
        custo_unitario: custoUnitario
      });

      setSku("");
      setQuantidade(1);
      setCustoUnitario(0);

      carregarEntradas();
    } catch (error) {
      console.log(error);
      alert("Erro ao registrar entrada");
    }
  }

  useEffect(() => {
    carregarEntradas();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Entradas de estoque
        </h2>

        <p className="text-gray-500">
          Entrada por SKU com cálculo automático de custo médio.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <form
          onSubmit={registrarEntrada}
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
            type="number"
            placeholder="Quantidade"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
          />

          <input
            className="border rounded-xl p-3"
            type="number"
            step="0.01"
            placeholder="Custo unitário"
            value={custoUnitario}
            onChange={(e) =>
              setCustoUnitario(Number(e.target.value))
            }
          />

          <button className="bg-green-700 text-white rounded-xl p-3 font-bold">
            Registrar entrada
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {entradas.map((entrada) => (
          <div
            key={entrada.id}
            className="bg-white rounded-2xl shadow p-4"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg">
                  {entrada.produto_nome}
                </h3>

                <p className="text-gray-500">
                  SKU: {entrada.sku}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Qtd</p>
                  <strong>{entrada.quantidade}</strong>
                </div>

                <div>
                  <p className="text-gray-500">Custo</p>

                  <strong>
                    R$ {Number(entrada.custo_unitario).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <p className="text-gray-500">Estoque</p>

                  <strong>
                    {entrada.estoque_anterior} →{" "}
                    {entrada.estoque_novo}
                  </strong>
                </div>

                <div>
                  <p className="text-gray-500">
                    Custo médio
                  </p>

                  <strong>
                    R${" "}
                    {Number(
                      entrada.custo_medio_anterior
                    ).toFixed(2)}
                    {" → "}
                    R${" "}
                    {Number(
                      entrada.custo_medio_novo
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <p className="text-gray-500">Total</p>

                  <strong>
                    R$ {Number(entrada.custo_total).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        ))}

        {entradas.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Nenhuma entrada registrada.
          </div>
        )}
      </div>
    </div>
  );
}