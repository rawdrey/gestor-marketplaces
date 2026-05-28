import { Link, Outlet, useNavigate } from "react-router-dom";

export function Layout() {
  const navigate = useNavigate();

  function sair() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">Gestor Marketplaces</h1>

          <button
            onClick={sair}
            className="bg-blue-900 px-3 py-2 rounded-lg text-sm"
          >
            Sair
          </button>
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
          <Link to="/clonar-anuncio" className="whitespace-nowrap font-medium">
  Clonar anúncio
</Link>
          <Link to="/entradas-estoque" className="whitespace-nowrap font-medium">
            Entradas
          </Link>
          <Link to="/anuncios" className="whitespace-nowrap font-medium">
            Anúncios
          </Link>
          <Link to="/vendas" className="whitespace-nowrap font-medium">
            Vendas
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