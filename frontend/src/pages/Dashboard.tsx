export function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500">Produtos</p>
          <strong className="text-2xl">0</strong>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500">Anúncios</p>
          <strong className="text-2xl">0</strong>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500">Estoque baixo</p>
          <strong className="text-2xl">0</strong>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <p className="text-gray-500">Lucro mês</p>
          <strong className="text-2xl">R$ 0,00</strong>
        </div>
      </div>
    </div>
  );
}