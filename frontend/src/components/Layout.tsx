import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { api } from "../services/api";

interface ContaMercadoLivre {
  id: number;
  nome_conta: string;
  nickname: string;
  conta_padrao: boolean;
  ativo: boolean;
}

export function Layout() {
  const navigate = useNavigate();
  const [contas, setContas] = useState<ContaMercadoLivre[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState(
    localStorage.getItem("conta_mercado_livre_id") || "todas"
  );

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("conta_mercado_livre_id");
    navigate("/login");
  }

  async function carregarContas() {
    try {
      const response = await api.get("/mercado-livre/contas");
      setContas(response.data);

      const contaPadrao = response.data.find(
        (conta: ContaMercadoLivre) => conta.conta_padrao
      );

      if (!localStorage.getItem("conta_mercado_livre_id") && contaPadrao) {
        localStorage.setItem("conta_mercado_livre_id", String(contaPadrao.id));
        setContaSelecionada(String(contaPadrao.id));
      }
    } catch {
      setContas([]);
    }
  }

  function alterarConta(valor: string) {
    setContaSelecionada(valor);

    if (valor === "todas") {
      localStorage.removeItem("conta_mercado_livre_id");
    } else {
      localStorage.setItem("conta_mercado_livre_id", valor);
    }

    window.location.reload();
  }

  useEffect(() => {
    carregarContas();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white p-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold">Gestor Marketplaces</h1>
            <p className="text-sm text-gray-300">
              Estoque, anúncios e financeiro
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="text-gray-900 rounded-lg p-2"
              value={contaSelecionada}
              onChange={(e) => alterarConta(e.target.value)}
            >
              <option value="todas">Todas as contas ML</option>

              {contas
                .filter((conta) => conta.ativo)
                .map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome_conta || conta.nickname}
                  </option>
                ))}
            </select>

            <button
              onClick={sair}
              className="bg-red-600 px-3 py-2 rounded-lg text-sm"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto flex gap-4 overflow-x-auto p-3 text-sm">
          <Link to="/" className="whitespace-nowrap font-medium">
            Dashboard
          </Link>

          <Link to="/produtos" className="whitespace-nowrap font-medium">
            Produtos
          </Link>

          <Link to="/entradas-estoque" className="whitespace-nowrap font-medium">
            Entradas
          </Link>

          <Link to="/anuncios" className="whitespace-nowrap font-medium">
            Anúncios
          </Link>

          <Link to="/acoes-massa" className="whitespace-nowrap font-medium">
            Ações em Massa
          </Link>

          <Link to="/qualidade" className="whitespace-nowrap font-medium">
            Qualidade
          </Link>

          <Link to="/precos" className="whitespace-nowrap font-medium">
            Preços
          </Link>

          <Link to="/estoque-compartilhado" className="whitespace-nowrap font-medium">
            Estoque Compartilhado
          </Link>


          <Link to="/vincular-sku" className="whitespace-nowrap font-medium">
            Vincular SKU
          </Link>
          <Link to="/sincronizacao" className="whitespace-nowrap font-medium">
            Sincronização
</Link>

          <Link to="/clonar-anuncio" className="whitespace-nowrap font-medium">
            Clonar anúncio
          </Link>

          <Link to="/vendas" className="whitespace-nowrap font-medium">
            Vendas
          </Link>

          <Link to="/mercado-livre" className="whitespace-nowrap font-medium">
            Mercado Livre
          </Link>

          <Link to="/configuracoes" className="whitespace-nowrap font-medium">
            Configurações
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}