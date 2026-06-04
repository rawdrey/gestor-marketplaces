import { useEffect, useState } from "react";
import { api } from "../services/api";

interface ContaMercadoLivre {
  id: number;
  ml_user_id: string;
  nickname: string;
  nome_conta: string;
  ativo: boolean;
  conta_padrao: boolean;
}

export function MercadoLivre() {
  const [contas, setContas] = useState<ContaMercadoLivre[]>([]);
  const [mensagem, setMensagem] = useState("");

  async function carregarContas() {
    const response = await api.get("/mercado-livre/contas");
    setContas(response.data);
  }

  async function importarVendas() {
    try {
      setMensagem("Importando vendas. Aguarde...");

      const response = await api.post("/mercado-livre/importar-vendas");

      setMensagem(
        `Vendas importadas. Encontradas: ${response.data.total_encontradas}. Importadas: ${response.data.importadas}. Duplicadas: ${response.data.ignoradas_duplicadas}. Sem SKU: ${response.data.ignoradas_sem_sku}.`
      );
    } catch (error) {
      console.log(error);
      setMensagem("Erro ao importar vendas.");
    }
  }

  async function conectarMercadoLivre() {
    const response = await api.get("/mercado-livre/auth-url");
    window.location.href = response.data.url;
  }

  async function definirPadrao(id: number) {
    await api.put(`/mercado-livre/contas/${id}/padrao`);
    carregarContas();
  }

  async function desativarConta(id: number) {
    await api.delete(`/mercado-livre/contas/${id}`);
    carregarContas();
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("conectado")) {
      setMensagem("Conta Mercado Livre conectada com sucesso.");
    }

    if (params.get("erro")) {
      setMensagem(`Erro ao conectar: ${params.get("erro")}`);
    }

    carregarContas();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mercado Livre</h2>
        <p className="text-gray-500">
          Conecte e gerencie múltiplas contas Mercado Livre.
        </p>
      </div>

      {mensagem && (
        <div className="bg-white rounded-2xl shadow p-4">
          {mensagem}
        </div>
      )}

      <div className="bg-gray-900 text-white rounded-3xl shadow p-6">
        <h3 className="text-xl font-bold">Conectar nova conta</h3>

        <p className="text-gray-300 mt-2">
          Autorize uma conta Mercado Livre para importar anúncios, vendas e
          sincronizar estoque.
        </p>

        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={conectarMercadoLivre}
            className="bg-yellow-400 text-gray-900 px-5 py-3 rounded-xl font-bold"
          >
            Conectar Mercado Livre
          </button>

          <button
            onClick={importarVendas}
            className="bg-green-500 text-white px-5 py-3 rounded-xl font-bold"
          >
            Importar vendas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {contas.map((conta) => (
          <div key={conta.id} className="bg-white rounded-2xl shadow p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg">
                  {conta.nome_conta || conta.nickname}
                </h3>

                <p className="text-gray-500">
                  Usuário ML: {conta.ml_user_id}
                </p>

                <p className="text-sm mt-2">
                  {conta.conta_padrao ? "Conta padrão" : "Conta secundária"} |{" "}
                  {conta.ativo ? "Ativa" : "Inativa"}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {!conta.conta_padrao && (
                  <button
                    onClick={() => definirPadrao(conta.id)}
                    className="border px-4 py-3 rounded-xl"
                  >
                    Definir padrão
                  </button>
                )}

                <button
                  onClick={() => desativarConta(conta.id)}
                  className="bg-red-600 text-white px-4 py-3 rounded-xl"
                >
                  Desativar
                </button>
              </div>
            </div>
          </div>
        ))}

        {contas.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Nenhuma conta Mercado Livre conectada.
          </div>
        )}
      </div>
    </div>
  );
}