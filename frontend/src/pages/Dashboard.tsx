import { useEffect, useState } from "react";
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
    try {
      const response = await api.get("/dashboard/resumo");
      setResumo(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    carregarResumo();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-gray-500">
          Visão geral do estoque, anúncios e financeiro.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500">Produtos cadastrados</p>
          <strong className="text-2xl">{resumo.total_produtos}</strong>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500">Anúncios ativos</p>
          <strong className="text-2xl">{resumo.total_anuncios}</strong>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500">Estoque baixo</p>
          <strong className="text-2xl text-red-600">
            {resumo.estoque_baixo}
          </strong>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500">Total vendido</p>
          <strong className="text-2xl">
            R$ {Number(resumo.total_vendido).toFixed(2)}
          </strong>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500">Lucro total</p>
          <strong
            className={
              resumo.lucro_total >= 0
                ? "text-2xl text-green-700"
                : "text-2xl text-red-600"
            }
          >
            R$ {Number(resumo.lucro_total).toFixed(2)}
          </strong>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500">Margem média</p>
          <strong className="text-2xl">
            {Number(resumo.margem_media).toFixed(2)}%
          </strong>
        </div>
      </div>
    </div>
  );
}