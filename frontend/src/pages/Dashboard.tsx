import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

interface DashboardData {
  resumo: any;
  top_produtos: any[];
  top_anuncios: any[];
  ultimas_vendas: any[];
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    resumo: {},
    top_produtos: [],
    top_anuncios: [],
    ultimas_vendas: []
  });

  async function carregarDashboard() {
    const response = await api.get("/dashboard/resumo");
    setData(response.data);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function percentual(valor: number) {
    return `${Number(valor || 0).toFixed(2)}%`;
  }

  const r = data.resumo;

  return (
    <div className="space-y-6">
      <section className="bg-gray-900 text-white rounded-3xl shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-gray-300">Painel executivo</p>
            <h2 className="text-3xl font-bold mt-1">
              Visão geral da operação
            </h2>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Acompanhe vendas, lucro, estoque, anúncios, qualidade e
              sincronização do Mercado Livre em um único painel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/precos"
              className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-center"
            >
              Central de Preços
            </Link>

            <Link
              to="/qualidade"
              className="bg-yellow-400 text-gray-900 px-4 py-3 rounded-xl font-bold text-center"
            >
              Qualidade
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-gray-500">Faturamento 30 dias</p>
          <strong className="text-3xl">
            {moeda(r.total_vendido_30_dias)}
          </strong>
          <p className="text-sm text-gray-400 mt-2">
            {r.vendas_30_dias || 0} vendas no período
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-gray-500">Lucro 30 dias</p>
          <strong
            className={
              Number(r.lucro_30_dias || 0) >= 0
                ? "text-3xl text-green-700"
                : "text-3xl text-red-600"
            }
          >
            {moeda(r.lucro_30_dias)}
          </strong>
          <p className="text-sm text-gray-400 mt-2">
            Já descontando custos e taxas
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-gray-500">Margem média</p>
          <strong className="text-3xl">{percentual(r.margem_media)}</strong>
          <p className="text-sm text-gray-400 mt-2">
            Média geral das vendas
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-gray-500">Valor em estoque</p>
          <strong className="text-3xl text-blue-700">
            {moeda(r.valor_estoque)}
          </strong>
          <p className="text-sm text-gray-400 mt-2">
            Baseado no custo médio
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card titulo="Produtos" valor={r.total_produtos} />
        <Card titulo="Anúncios" valor={r.total_anuncios} />
        <Card titulo="Ativos" valor={r.anuncios_ativos} />
        <Card titulo="Pausados" valor={r.anuncios_pausados} />
        <Card titulo="Sem SKU" valor={r.anuncios_sem_sku} alerta />
        <Card titulo="Estoque baixo" valor={r.estoque_baixo} alerta />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-lg mb-3">Sincronização</h3>

          <Linha label="Pendentes" valor={r.sync_pendente} destaque="yellow" />
          <Linha label="Erros" valor={r.sync_erro} destaque="red" />
          <Linha label="Enviados" valor={r.sync_enviado} destaque="green" />

          <Link
            to="/sincronizacao"
            className="block mt-4 bg-gray-900 text-white text-center rounded-xl p-3 font-bold"
          >
            Abrir central
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-lg mb-3">Qualidade dos anúncios</h3>

          <Linha
            label="Score médio"
            valor={`${Number(r.qualidade_media || 0).toFixed(0)}%`}
          />
          <Linha label="Críticos" valor={r.qualidade_criticos} destaque="red" />
          <Linha label="Sem estoque" valor={r.anuncios_sem_estoque} destaque="red" />

          <Link
            to="/qualidade"
            className="block mt-4 bg-yellow-400 text-gray-900 text-center rounded-xl p-3 font-bold"
          >
            Ver qualidade
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-lg mb-3">Ações rápidas</h3>

          <div className="grid gap-3">
            <Link className="border rounded-xl p-3" to="/entradas-estoque">
              Registrar entrada de estoque
            </Link>
            <Link className="border rounded-xl p-3" to="/vincular-sku">
              Vincular SKU pendente
            </Link>
            <Link className="border rounded-xl p-3" to="/clonar-anuncio">
              Clonar anúncio ML
            </Link>
            <Link className="border rounded-xl p-3" to="/mercado-livre">
              Importar anúncios/vendas
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Tabela titulo="Top produtos 30 dias" itens={data.top_produtos} />
        <Tabela titulo="Top anúncios 30 dias" itens={data.top_anuncios} />
      </section>

      <section className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-bold text-lg mb-4">Últimas vendas</h3>

        <div className="grid grid-cols-1 gap-3">
          {data.ultimas_vendas.map((venda) => (
            <div
              key={venda.id}
              className="border rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-sm"
            >
              <div className="md:col-span-2">
                <p className="text-gray-500">Produto</p>
                <strong>{venda.sku} - {venda.produto_nome}</strong>
              </div>

              <div>
                <p className="text-gray-500">Venda</p>
                <strong>{venda.codigo_venda}</strong>
              </div>

              <div>
                <p className="text-gray-500">Valor</p>
                <strong>{moeda(venda.valor_bruto)}</strong>
              </div>

              <div>
                <p className="text-gray-500">Lucro</p>
                <strong className="text-green-700">
                  {moeda(venda.lucro)}
                </strong>
              </div>
            </div>
          ))}

          {data.ultimas_vendas.length === 0 && (
            <p className="text-gray-500">Nenhuma venda registrada.</p>
          )}
        </div>
      </section>
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
      <p className="text-gray-500 text-sm">{titulo}</p>
      <strong className={alerta ? "text-2xl text-red-600" : "text-2xl"}>
        {valor || 0}
      </strong>
    </div>
  );
}

function Linha({
  label,
  valor,
  destaque
}: {
  label: string;
  valor: any;
  destaque?: "red" | "green" | "yellow";
}) {
  const classe =
    destaque === "red"
      ? "text-red-600"
      : destaque === "green"
      ? "text-green-700"
      : destaque === "yellow"
      ? "text-yellow-600"
      : "";

  return (
    <div className="flex justify-between border-b py-2">
      <span>{label}</span>
      <strong className={classe}>{valor || 0}</strong>
    </div>
  );
}

function Tabela({ titulo, itens }: { titulo: string; itens: any[] }) {
  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h3 className="font-bold text-lg mb-4">{titulo}</h3>

      <div className="grid grid-cols-1 gap-3">
        {itens.map((item, index) => (
          <div key={index} className="border rounded-xl p-4 text-sm">
            <strong>
              {item.sku || item.codigo_anuncio || "Sem código"} -{" "}
              {item.nome || item.titulo || "Sem título"}
            </strong>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-gray-500">Qtd</p>
                <strong>{item.quantidade_vendida}</strong>
              </div>

              <div>
                <p className="text-gray-500">Faturamento</p>
                <strong>{moeda(item.faturamento)}</strong>
              </div>

              <div>
                <p className="text-gray-500">Lucro</p>
                <strong className="text-green-700">{moeda(item.lucro)}</strong>
              </div>
            </div>
          </div>
        ))}

        {itens.length === 0 && (
          <p className="text-gray-500">Nenhum dado encontrado.</p>
        )}
      </div>
    </div>
  );
}