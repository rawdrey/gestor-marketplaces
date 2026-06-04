import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

interface ItemSync {
  id: number;
  tipo: string;
  status: string;
  tentativa: number;
  erro?: string;
  criado_em: string;
  atualizado_em: string;
  processado_em?: string;
  anuncio_titulo?: string;
  codigo_anuncio?: string;
  sku_marketplace?: string;
  conta_nickname?: string;
  nome_conta?: string;
}

export function Sincronizacao() {
  const [itens, setItens] = useState<ItemSync[]>([]);
  const [filtro, setFiltro] = useState("todos");

  async function carregarFila() {
    const response = await api.get("/sincronizacao");
    setItens(response.data);
  }

  async function reenviar(id: number) {
    await api.put(`/sincronizacao/${id}/reenviar`);
    carregarFila();
  }

  useEffect(() => {
    carregarFila();
  }, []);

  const itensFiltrados = itens.filter((item) => {
    if (filtro === "todos") return true;
    return item.status === filtro;
  });

  const metricas = useMemo(() => {
    return {
      total: itens.length,
      pendentes: itens.filter((i) => i.status === "pendente").length,
      enviados: itens.filter((i) => i.status === "enviado").length,
      erros: itens.filter((i) => i.status === "erro").length
    };
  }, [itens]);

  function formatarData(data?: string) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function statusClasse(status: string) {
    if (status === "enviado") return "text-green-700";
    if (status === "erro") return "text-red-600";
    return "text-yellow-600";
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Central de Sincronização</h2>
        <p className="text-gray-500">
          Acompanhe envios de estoque, preço e atualizações para o Mercado Livre.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Total</p>
          <strong className="text-3xl">{metricas.total}</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Pendentes</p>
          <strong className="text-3xl text-yellow-600">
            {metricas.pendentes}
          </strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Enviados</p>
          <strong className="text-3xl text-green-700">
            {metricas.enviados}
          </strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Erros</p>
          <strong className="text-3xl text-red-600">{metricas.erros}</strong>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 flex flex-col md:flex-row gap-3">
        <select
          className="border rounded-xl p-3"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="pendente">Pendentes</option>
          <option value="enviado">Enviados</option>
          <option value="erro">Erros</option>
        </select>

        <button
          onClick={carregarFila}
          className="bg-gray-900 text-white rounded-xl p-3 font-bold"
        >
          Recarregar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {itensFiltrados.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow p-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  Fila #{item.id} | {item.tipo}
                </p>

                <h3 className="font-bold text-lg">
                  {item.anuncio_titulo || "Anúncio não identificado"}
                </h3>

                <p className="text-gray-500">
                  MLB: {item.codigo_anuncio || "-"} | SKU:{" "}
                  {item.sku_marketplace || "-"}
                </p>

                <p className="text-gray-500">
                  Conta: {item.nome_conta || item.conta_nickname || "-"}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <strong className={statusClasse(item.status)}>
                  {item.status}
                </strong>

                {item.status === "erro" && (
                  <button
                    onClick={() => reenviar(item.id)}
                    className="bg-blue-700 text-white px-4 py-3 rounded-xl font-bold"
                  >
                    Reenviar
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-4">
              <div>
                <p className="text-gray-500">Tentativas</p>
                <strong>{item.tentativa}</strong>
              </div>

              <div>
                <p className="text-gray-500">Criado em</p>
                <strong>{formatarData(item.criado_em)}</strong>
              </div>

              <div>
                <p className="text-gray-500">Atualizado em</p>
                <strong>{formatarData(item.atualizado_em)}</strong>
              </div>

              <div>
                <p className="text-gray-500">Processado em</p>
                <strong>{formatarData(item.processado_em)}</strong>
              </div>
            </div>

            {item.erro && (
              <div className="mt-4 bg-red-50 text-red-700 rounded-xl p-3 text-sm">
                {item.erro}
              </div>
            )}
          </div>
        ))}

        {itensFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Nenhum item de sincronização encontrado.
          </div>
        )}
      </div>
    </div>
  );
}