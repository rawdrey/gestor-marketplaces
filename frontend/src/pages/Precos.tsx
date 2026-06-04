import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

interface AnuncioPreco {
  id: number;
  codigo_anuncio?: string;
  titulo: string;
  tipo_anuncio: string;
  preco_venda: number;
  preco_sincronizado: number;
  preco_inteligente_sugerido?: number;
  lucro_estimado: number;
  margem_estimada: number;
  estoque_anuncio: number;
  status: string;
  sku_marketplace?: string;
  conta_nickname?: string;
  nome_conta?: string;
}

export function Precos() {
  const [anuncios, setAnuncios] = useState<AnuncioPreco[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [tipoReajuste, setTipoReajuste] = useState("percentual");
  const [operacao, setOperacao] = useState("aumentar");
  const [valorReajuste, setValorReajuste] = useState(0);
  const [enviarFila, setEnviarFila] = useState(true);
  const [mensagem, setMensagem] = useState("");

  const [precoClassico, setPrecoClassico] = useState(0);
  const [precoPremium, setPrecoPremium] = useState(0);
  const [margemDesejada, setMargemDesejada] = useState(30);

  async function carregar() {
    const response = await api.get("/precos/anuncios");
    setAnuncios(response.data);
  }

  function alternarSelecionado(id: number) {
    setSelecionados((atual) =>
      atual.includes(id)
        ? atual.filter((item) => item !== id)
        : [...atual, id]
    );
  }

  function selecionarTodos() {
    if (selecionados.length === anuncios.length) {
      setSelecionados([]);
    } else {
      setSelecionados(anuncios.map((a) => a.id));
    }
  }

  async function reajustar(event: FormEvent) {
    event.preventDefault();

    const response = await api.post("/precos/reajustar", {
      anuncio_ids: selecionados,
      tipo_reajuste: tipoReajuste,
      operacao,
      valor_reajuste: valorReajuste,
      enviar_para_fila: enviarFila
    });

    setMensagem(
      `Reajuste concluído. Atualizados: ${response.data.atualizados}. Enfileirados: ${response.data.enfileirados}.`
    );

    setSelecionados([]);
    carregar();
  }

  async function aplicarInteligente(event: FormEvent) {
    event.preventDefault();

    const response = await api.post("/precos/inteligente", {
      anuncio_ids: selecionados,
      preco_classico: precoClassico,
      preco_premium: precoPremium,
      margem_desejada: margemDesejada,
      enviar_para_fila: enviarFila
    });

    setMensagem(
      `Preço inteligente aplicado. Atualizados: ${response.data.atualizados}. Enfileirados: ${response.data.enfileirados}.`
    );

    setSelecionados([]);
    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  const metricas = useMemo(() => {
    const total = anuncios.length;
    const precoDiferente = anuncios.filter(
      (a) => Number(a.preco_venda) !== Number(a.preco_sincronizado)
    ).length;

    const lucroTotal = anuncios.reduce(
      (soma, a) => soma + Number(a.lucro_estimado || 0),
      0
    );

    const classicos = anuncios.filter((a) =>
      String(a.tipo_anuncio || "").toLowerCase().includes("special") ||
      String(a.tipo_anuncio || "").toLowerCase().includes("classico")
    ).length;

    const premium = anuncios.filter((a) =>
      String(a.tipo_anuncio || "").toLowerCase().includes("pro") ||
      String(a.tipo_anuncio || "").toLowerCase().includes("premium")
    ).length;

    return {
      total,
      selecionados: selecionados.length,
      precoDiferente,
      lucroTotal,
      classicos,
      premium
    };
  }, [anuncios, selecionados]);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Central de Preços</h2>
        <p className="text-gray-500">
          Reajuste preços em massa, aplique preço inteligente e envie para o Mercado Livre.
        </p>
      </div>

      {mensagem && (
        <div className="bg-white rounded-2xl shadow p-4">
          {mensagem}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card titulo="Anúncios" valor={metricas.total} />
        <Card titulo="Selecionados" valor={metricas.selecionados} />
        <Card titulo="Clássico" valor={metricas.classicos} />
        <Card titulo="Premium" valor={metricas.premium} />
        <Card titulo="Preço alterado" valor={metricas.precoDiferente} alerta />
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Lucro estimado</p>
          <strong className="text-xl text-green-700">
            {moeda(metricas.lucroTotal)}
          </strong>
        </div>
      </div>

      <form
        onSubmit={aplicarInteligente}
        className="bg-gray-900 text-white rounded-3xl shadow p-5 space-y-4"
      >
        <div>
          <h3 className="text-xl font-bold">Preço Inteligente</h3>
          <p className="text-gray-300">
            Defina preço separado para Clássico e Premium, ou deixe zerado para calcular pela margem desejada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label>
            <span className="block mb-1 font-medium">Preço Clássico</span>
            <input
              className="border rounded-xl p-3 w-full text-gray-900"
              type="number"
              step="0.01"
              value={precoClassico}
              onChange={(e) => setPrecoClassico(Number(e.target.value))}
            />
          </label>

          <label>
            <span className="block mb-1 font-medium">Preço Premium</span>
            <input
              className="border rounded-xl p-3 w-full text-gray-900"
              type="number"
              step="0.01"
              value={precoPremium}
              onChange={(e) => setPrecoPremium(Number(e.target.value))}
            />
          </label>

          <label>
            <span className="block mb-1 font-medium">Margem desejada (%)</span>
            <input
              className="border rounded-xl p-3 w-full text-gray-900"
              type="number"
              step="0.01"
              value={margemDesejada}
              onChange={(e) => setMargemDesejada(Number(e.target.value))}
            />
          </label>

          <label className="flex items-center gap-2 bg-gray-800 rounded-xl p-3">
            <input
              type="checkbox"
              checked={enviarFila}
              onChange={(e) => setEnviarFila(e.target.checked)}
            />
            Enviar para fila ML
          </label>
        </div>

        <button className="bg-yellow-400 text-gray-900 rounded-xl p-3 font-bold w-full">
          Aplicar preço inteligente
        </button>
      </form>

      <form
        onSubmit={reajustar}
        className="bg-white rounded-2xl shadow p-4 grid grid-cols-1 md:grid-cols-5 gap-4"
      >
        <select
          className="border rounded-xl p-3"
          value={operacao}
          onChange={(e) => setOperacao(e.target.value)}
        >
          <option value="aumentar">Aumentar</option>
          <option value="reduzir">Reduzir</option>
        </select>

        <select
          className="border rounded-xl p-3"
          value={tipoReajuste}
          onChange={(e) => setTipoReajuste(e.target.value)}
        >
          <option value="percentual">Percentual</option>
          <option value="valor">Valor fixo</option>
        </select>

        <input
          className="border rounded-xl p-3"
          type="number"
          step="0.01"
          placeholder="Valor"
          value={valorReajuste}
          onChange={(e) => setValorReajuste(Number(e.target.value))}
        />

        <label className="flex items-center gap-2 bg-gray-100 rounded-xl p-3">
          <input
            type="checkbox"
            checked={enviarFila}
            onChange={(e) => setEnviarFila(e.target.checked)}
          />
          Enviar para fila ML
        </label>

        <button className="bg-blue-700 text-white rounded-xl p-3 font-bold">
          Reajustar
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow p-4">
        <button
          onClick={selecionarTodos}
          className="bg-gray-900 text-white px-4 py-3 rounded-xl font-bold"
        >
          {selecionados.length === anuncios.length
            ? "Desmarcar todos"
            : "Selecionar todos"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {anuncios.map((anuncio) => {
          const selecionado = selecionados.includes(anuncio.id);

          return (
            <div
              key={anuncio.id}
              className={
                selecionado
                  ? "bg-blue-50 rounded-2xl shadow p-4 border border-blue-300"
                  : "bg-white rounded-2xl shadow p-4"
              }
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {anuncio.codigo_anuncio || "Sem MLB"} | {anuncio.tipo_anuncio || "Sem tipo"}
                  </p>

                  <h3 className="font-bold text-lg">{anuncio.titulo}</h3>

                  <p className="text-gray-500">
                    SKU: {anuncio.sku_marketplace || "-"}
                  </p>

                  <p className="text-gray-500">
                    Conta:{" "}
                    {anuncio.nome_conta ||
                      anuncio.conta_nickname ||
                      "Sem conta"}
                  </p>
                </div>

                <button
                  onClick={() => alternarSelecionado(anuncio.id)}
                  className={
                    selecionado
                      ? "bg-blue-700 text-white px-4 py-3 rounded-xl font-bold"
                      : "bg-gray-900 text-white px-4 py-3 rounded-xl font-bold"
                  }
                >
                  {selecionado ? "Selecionado" : "Selecionar"}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm mt-4">
                <Info titulo="Preço atual" valor={moeda(anuncio.preco_venda)} />
                <Info titulo="Preço ML" valor={moeda(anuncio.preco_sincronizado)} />
                <Info titulo="Sugerido" valor={moeda(anuncio.preco_inteligente_sugerido || 0)} />
                <Info titulo="Lucro" valor={moeda(anuncio.lucro_estimado)} />
                <Info titulo="Margem" valor={`${Number(anuncio.margem_estimada || 0).toFixed(2)}%`} />
                <Info titulo="Estoque" valor={anuncio.estoque_anuncio} />
              </div>
            </div>
          );
        })}

        {anuncios.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Nenhum anúncio encontrado.
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
      <strong className={alerta ? "text-3xl text-yellow-600" : "text-3xl"}>
        {valor || 0}
      </strong>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: any }) {
  return (
    <div>
      <p className="text-gray-500">{titulo}</p>
      <strong>{valor}</strong>
    </div>
  );
}