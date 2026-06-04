import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

interface AnuncioVinculado {
  anuncio_id: number;
  codigo_anuncio?: string;
  titulo?: string;
  estoque_anuncio: number;
  estoque_sincronizado: number;
  preco_venda: number;
  status: string;
  conta_id?: number;
  conta_nome?: string;
}

interface ItemEstoque {
  produto_id: number;
  sku: string;
  produto_nome: string;
  estoque_atual: number;
  estoque_minimo: number;
  custo_medio: number;
  total_anuncios: number;
  total_contas: number;
  pendentes_sync: number;
  anuncios?: AnuncioVinculado[];
}

export function EstoqueCompartilhado() {
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    const response = await api.get("/estoque-compartilhado");
    setItens(response.data);
  }

  async function sincronizar(produtoId: number) {
    const response = await api.post(
      `/estoque-compartilhado/${produtoId}/sincronizar`
    );

    setMensagem(
      `${response.data.sku}: ${response.data.anuncios_enfileirados} anúncios enviados para sincronização.`
    );

    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = itens.filter((item) => {
    const texto = busca.toLowerCase();

    return (
      item.sku?.toLowerCase().includes(texto) ||
      item.produto_nome?.toLowerCase().includes(texto)
    );
  });

  const metricas = useMemo(() => {
    const totalSkus = itens.length;
    const skusMulticonta = itens.filter(
      (i) => Number(i.total_contas) > 1
    ).length;
    const pendentes = itens.reduce(
      (soma, i) => soma + Number(i.pendentes_sync || 0),
      0
    );
    const anuncios = itens.reduce(
      (soma, i) => soma + Number(i.total_anuncios || 0),
      0
    );

    return {
      totalSkus,
      skusMulticonta,
      pendentes,
      anuncios
    };
  }, [itens]);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Estoque Compartilhado</h2>
        <p className="text-gray-500">
          Controle o mesmo SKU em múltiplas contas Mercado Livre com estoque central.
        </p>
      </div>

      {mensagem && (
        <div className="bg-white rounded-2xl shadow p-4">
          {mensagem}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="SKUs" valor={metricas.totalSkus} />
        <Card titulo="Multi-conta" valor={metricas.skusMulticonta} />
        <Card titulo="Anúncios" valor={metricas.anuncios} />
        <Card titulo="Pendentes sync" valor={metricas.pendentes} alerta />
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
        {filtrados.map((item) => {
          const estoqueBaixo =
            Number(item.estoque_atual) <= Number(item.estoque_minimo);

          return (
            <div key={item.produto_id} className="bg-white rounded-2xl shadow p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  <h3 className="font-bold text-lg">{item.produto_nome}</h3>

                  <p className="text-gray-500">
                    {item.total_anuncios} anúncios em {item.total_contas} conta(s)
                  </p>
                </div>

                <button
                  onClick={() => sincronizar(item.produto_id)}
                  className="bg-blue-700 text-white px-4 py-3 rounded-xl font-bold"
                >
                  Sincronizar SKU
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mt-4">
                <Info
                  titulo="Estoque central"
                  valor={item.estoque_atual}
                  alerta={estoqueBaixo}
                />
                <Info titulo="Mínimo" valor={item.estoque_minimo} />
                <Info titulo="Custo médio" valor={moeda(item.custo_medio)} />
                <Info titulo="Contas" valor={item.total_contas} />
                <Info
                  titulo="Pendente sync"
                  valor={item.pendentes_sync}
                  alerta={Number(item.pendentes_sync) > 0}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                {(item.anuncios || []).map((anuncio) => (
                  <div
                    key={anuncio.anuncio_id}
                    className="border rounded-xl p-3 grid grid-cols-1 md:grid-cols-5 gap-3 text-sm"
                  >
                    <div className="md:col-span-2">
                      <p className="text-gray-500">
                        {anuncio.codigo_anuncio || "Sem MLB"}
                      </p>
                      <strong>{anuncio.titulo || "Sem título"}</strong>
                    </div>

                    <Info titulo="Conta" valor={anuncio.conta_nome || "-"} />
                    <Info titulo="Estoque anúncio" valor={anuncio.estoque_anuncio} />
                    <Info titulo="Preço" valor={moeda(anuncio.preco_venda)} />
                  </div>
                ))}

                {(!item.anuncios || item.anuncios.length === 0) && (
                  <p className="text-gray-500 text-sm">
                    Nenhum anúncio vinculado a este SKU.
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Nenhum SKU encontrado.
          </div>
        )}
      </div>
    </div>
  );
}

function Card({
  titulo,
  valor,
  alerta
}: {
  titulo: string;
  valor: any;
  alerta?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <p className="text-gray-500">{titulo}</p>
      <strong className={alerta ? "text-3xl text-red-600" : "text-3xl"}>
        {valor || 0}
      </strong>
    </div>
  );
}

function Info({
  titulo,
  valor,
  alerta
}: {
  titulo: string;
  valor: any;
  alerta?: boolean;
}) {
  return (
    <div>
      <p className="text-gray-500">{titulo}</p>
      <strong className={alerta ? "text-red-600" : ""}>{valor || 0}</strong>
    </div>
  );
}