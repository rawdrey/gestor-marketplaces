import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

interface ResumoDashboard {
  total_produtos: number;
  total_anuncios: number;
  estoque_baixo: number;
  total_vendido: number;
  lucro_total: number;
  margem_media: number;
}

export function Dashboard() {
  const [resumo, setResumo] = useState<ResumoDashboard>({
    total_produtos: 0,
    total_anuncios: 0,
    estoque_baixo: 0,
    total_vendido: 0,
    lucro_total: 0,
    margem_media: 0
  });

  async function carregarResumo() {
    const response = await api.get("/dashboard/resumo");
    setResumo(response.data);
  }

  useEffect(() => {
    carregarResumo();
  }, []);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  return (
    <div className="space-y-6">
      <section className="bg-gray-900 text-white rounded-3xl shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-gray-300">Painel principal</p>
            <h2 className="text-3xl font-bold mt-1">
              Controle de estoque, anúncios e lucro
            </h2>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Acompanhe seus SKUs, anúncios do Mercado Livre, vendas,
              estoque baixo e resultado financeiro em um só lugar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/produtos"
              className="bg-white text-gray-900 px-4 py-3 rounded-xl font-bold text-center"
            >
              Novo SKU
            </Link>

            <Link
              to="/anuncios"
              className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-center"
            >
              Ver anúncios
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-gray-500">Total vendido</p>
          <strong className="text-3xl">
            {moeda(resumo.total_vendido)}
          </strong>
          <p className="text-sm text-gray-400 mt-2">
            Soma das vendas registradas.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-gray-500">Lucro total</p>
          <strong
            className={
              resumo.lucro_total >= 0
                ? "text-3xl text-green-700"
                : "text-3xl text-red-600"
            }
          >
            {moeda(resumo.lucro_total)}
          </strong>
          <p className="text-sm text-gray-400 mt-2">
            Após custo, frete, taxas e gastos.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-gray-500">Margem média</p>
          <strong className="text-3xl">
            {Number(resumo.margem_media).toFixed(2)}%
          </strong>
          <p className="text-sm text-gray-400 mt-2">
            Média das margens de lucro.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Produtos/SKUs</p>
          <strong className="text-2xl">{resumo.total_produtos}</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Anúncios</p>
          <strong className="text-2xl">{resumo.total_anuncios}</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Estoque baixo</p>
          <strong className="text-2xl text-red-600">
            {resumo.estoque_baixo}
          </strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500 text-sm">Marketplace foco</p>
          <strong className="text-2xl">ML</strong>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-lg mb-3">Ações rápidas</h3>

          <div className="grid grid-cols-1 gap-3">
            <Link
              to="/entradas-estoque"
              className="border rounded-xl p-4 hover:bg-gray-50"
            >
              Registrar entrada de estoque
            </Link>

            <Link
              to="/vendas"
              className="border rounded-xl p-4 hover:bg-gray-50"
            >
              Registrar venda manual
            </Link>

            <Link
              to="/anuncios"
              className="border rounded-xl p-4 hover:bg-gray-50"
            >
              Criar ou clonar anúncio
            </Link>

            <Link
              to="/configuracoes"
              className="border rounded-xl p-4 hover:bg-gray-50"
            >
              Ajustar custos e imposto
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-lg mb-3">Status do sistema</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span>Estoque central por SKU</span>
              <strong className="text-green-700">Ativo</strong>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span>Custo médio automático</span>
              <strong className="text-green-700">Ativo</strong>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span>Clonagem local de anúncios</span>
              <strong className="text-green-700">Ativo</strong>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span>API Mercado Livre</span>
              <strong className="text-yellow-600">Pendente</strong>
            </div>

            <div className="flex justify-between">
              <span>Sincronização automática</span>
              <strong className="text-yellow-600">Preparada</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}