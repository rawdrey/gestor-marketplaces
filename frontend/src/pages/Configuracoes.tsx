import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";

export function Configuracoes() {
  const [percentualImposto, setPercentualImposto] = useState(0);
  const [custoEmbalagemPadrao, setCustoEmbalagemPadrao] = useState(0);
  const [outrosGastosPadrao, setOutrosGastosPadrao] = useState(0);
  const [marketplacePadrao, setMarketplacePadrao] = useState("mercado_livre");
  const [mensagem, setMensagem] = useState("");

  async function carregarConfiguracoes() {
    try {
      const response = await api.get("/configuracoes");

      setPercentualImposto(Number(response.data.percentual_imposto || 0));
      setCustoEmbalagemPadrao(Number(response.data.custo_embalagem_padrao || 0));
      setOutrosGastosPadrao(Number(response.data.outros_gastos_padrao || 0));
      setMarketplacePadrao(response.data.marketplace_padrao || "mercado_livre");
    } catch (error) {
      console.log(error);
    }
  }

  async function salvarConfiguracoes(event: FormEvent) {
    event.preventDefault();
    setMensagem("");

    try {
      await api.put("/configuracoes", {
        percentual_imposto: percentualImposto,
        custo_embalagem_padrao: custoEmbalagemPadrao,
        outros_gastos_padrao: outrosGastosPadrao,
        marketplace_padrao: marketplacePadrao
      });

      setMensagem("Configurações salvas com sucesso");
    } catch (error) {
      console.log(error);
      setMensagem("Erro ao salvar configurações");
    }
  }

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurações financeiras</h2>
        <p className="text-gray-500">
          Defina custos padrão usados no cálculo de lucro.
        </p>
      </div>

      {mensagem && (
        <div className="bg-white rounded-2xl shadow p-4">
          {mensagem}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-4">
        <form
          onSubmit={salvarConfiguracoes}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <label>
            <span className="block mb-1 font-medium">
              Percentual de imposto (%)
            </span>
            <input
              className="border rounded-xl p-3 w-full"
              type="number"
              step="0.01"
              value={percentualImposto}
              onChange={(e) =>
                setPercentualImposto(Number(e.target.value))
              }
            />
          </label>

          <label>
            <span className="block mb-1 font-medium">
              Custo padrão de embalagem
            </span>
            <input
              className="border rounded-xl p-3 w-full"
              type="number"
              step="0.01"
              value={custoEmbalagemPadrao}
              onChange={(e) =>
                setCustoEmbalagemPadrao(Number(e.target.value))
              }
            />
          </label>

          <label>
            <span className="block mb-1 font-medium">
              Outros gastos padrão
            </span>
            <input
              className="border rounded-xl p-3 w-full"
              type="number"
              step="0.01"
              value={outrosGastosPadrao}
              onChange={(e) =>
                setOutrosGastosPadrao(Number(e.target.value))
              }
            />
          </label>

          <label>
            <span className="block mb-1 font-medium">
              Marketplace padrão
            </span>
            <select
              className="border rounded-xl p-3 w-full"
              value={marketplacePadrao}
              onChange={(e) => setMarketplacePadrao(e.target.value)}
            >
              <option value="mercado_livre">Mercado Livre</option>
              <option value="shopee">Shopee</option>
              <option value="manual">Manual</option>
            </select>
          </label>

          <button className="bg-blue-700 text-white rounded-xl p-3 font-bold md:col-span-2">
            Salvar configurações
          </button>
        </form>
      </div>
    </div>
  );
}