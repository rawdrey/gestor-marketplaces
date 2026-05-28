import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";

interface Produto {
  id: number;
  sku: string;
  nome: string;
}

interface Anuncio {
  id: number;
  titulo: string;
}

interface Venda {
  id: number;
  sku: string;
  produto_nome: string;
  anuncio_titulo: string;
  marketplace: string;
  quantidade: number;
  valor_bruto: number;
  taxa_marketplace: number;
  frete_descontado: number;
  imposto: number;
  embalagem: number;
  outros_gastos: number;
  custo_produto: number;
  lucro: number;
  margem_lucro: number;
  data_venda: string;
}

export function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);

  const [produtoId, setProdutoId] = useState("");
  const [anuncioId, setAnuncioId] = useState("");
  const [marketplace, setMarketplace] = useState("mercado_livre");
  const [codigoVenda, setCodigoVenda] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorBruto, setValorBruto] = useState(0);
  const [taxaMarketplace, setTaxaMarketplace] = useState(0);
  const [fretePagoCliente, setFretePagoCliente] = useState(0);
  const [freteDescontado, setFreteDescontado] = useState(0);
  const [outrosGastos, setOutrosGastos] = useState(0);

  async function carregarVendas() {
    const response = await api.get("/vendas");
    setVendas(response.data);
  }

  async function carregarProdutos() {
    const response = await api.get("/produtos");
    setProdutos(response.data);
  }

  async function carregarAnuncios() {
    const response = await api.get("/anuncios");
    setAnuncios(response.data);
  }

  async function registrarVenda(event: FormEvent) {
    event.preventDefault();

    try {
      await api.post("/vendas", {
        produto_id: Number(produtoId),
        anuncio_id: anuncioId ? Number(anuncioId) : null,
        marketplace,
        codigo_venda: codigoVenda,
        quantidade,
        valor_bruto: valorBruto,
        taxa_marketplace: taxaMarketplace,
        frete_pago_cliente: fretePagoCliente,
        frete_descontado: freteDescontado,
        outros_gastos: outrosGastos
      });

      setCodigoVenda("");
      setQuantidade(1);
      setValorBruto(0);
      setTaxaMarketplace(0);
      setFretePagoCliente(0);
      setFreteDescontado(0);
      setOutrosGastos(0);

      carregarVendas();
    } catch (error) {
      console.log(error);
      alert("Erro ao registrar venda");
    }
  }

  useEffect(() => {
    carregarVendas();
    carregarProdutos();
    carregarAnuncios();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Vendas</h2>
        <p className="text-gray-500">
          Registre vendas e acompanhe lucro real.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <form
          onSubmit={registrarVenda}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <select
            className="border rounded-xl p-3"
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
          >
            <option value="">Selecione produto</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.sku} - {produto.nome}
              </option>
            ))}
          </select>

          <select
            className="border rounded-xl p-3"
            value={anuncioId}
            onChange={(e) => setAnuncioId(e.target.value)}
          >
            <option value="">Sem anúncio vinculado</option>
            {anuncios.map((anuncio) => (
              <option key={anuncio.id} value={anuncio.id}>
                {anuncio.titulo}
              </option>
            ))}
          </select>

          <select
            className="border rounded-xl p-3"
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
          >
            <option value="mercado_livre">Mercado Livre</option>
            <option value="shopee">Shopee</option>
            <option value="manual">Manual</option>
          </select>

          <input
            className="border rounded-xl p-3"
            placeholder="Código venda"
            value={codigoVenda}
            onChange={(e) => setCodigoVenda(e.target.value)}
          />

          <input
            className="border rounded-xl p-3"
            type="number"
            placeholder="Quantidade"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
          />

          <input
            className="border rounded-xl p-3"
            type="number"
            step="0.01"
            placeholder="Valor bruto"
            value={valorBruto}
            onChange={(e) => setValorBruto(Number(e.target.value))}
          />

          <input
            className="border rounded-xl p-3"
            type="number"
            step="0.01"
            placeholder="Taxa marketplace"
            value={taxaMarketplace}
            onChange={(e) => setTaxaMarketplace(Number(e.target.value))}
          />

          <input
            className="border rounded-xl p-3"
            type="number"
            step="0.01"
            placeholder="Frete pago pelo cliente"
            value={fretePagoCliente}
            onChange={(e) => setFretePagoCliente(Number(e.target.value))}
          />

          <input
            className="border rounded-xl p-3"
            type="number"
            step="0.01"
            placeholder="Frete descontado"
            value={freteDescontado}
            onChange={(e) => setFreteDescontado(Number(e.target.value))}
          />

          <input
            className="border rounded-xl p-3 md:col-span-2"
            type="number"
            step="0.01"
            placeholder="Outros gastos"
            value={outrosGastos}
            onChange={(e) => setOutrosGastos(Number(e.target.value))}
          />

          <button className="bg-green-700 text-white rounded-xl p-3 font-bold">
            Registrar venda
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {vendas.map((venda) => (
          <div key={venda.id} className="bg-white rounded-2xl shadow p-4">
            <h3 className="font-bold text-lg">{venda.produto_nome}</h3>
            <p className="text-gray-500">SKU: {venda.sku}</p>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm mt-4">
              <div>
                <p className="text-gray-500">Qtd</p>
                <strong>{venda.quantidade}</strong>
              </div>

              <div>
                <p className="text-gray-500">Venda</p>
                <strong>R$ {Number(venda.valor_bruto).toFixed(2)}</strong>
              </div>

              <div>
                <p className="text-gray-500">Custo</p>
                <strong>R$ {Number(venda.custo_produto).toFixed(2)}</strong>
              </div>

              <div>
                <p className="text-gray-500">Taxas/frete</p>
                <strong>
                  R$ {Number(Number(venda.taxa_marketplace) + Number(venda.frete_descontado)).toFixed(2)}
                </strong>
              </div>

              <div>
                <p className="text-gray-500">Lucro</p>
                <strong className={Number(venda.lucro) >= 0 ? "text-green-700" : "text-red-600"}>
                  R$ {Number(venda.lucro).toFixed(2)}
                </strong>
              </div>

              <div>
                <p className="text-gray-500">Margem</p>
                <strong>{Number(venda.margem_lucro).toFixed(2)}%</strong>
              </div>
            </div>
          </div>
        ))}

        {vendas.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Nenhuma venda registrada.
          </div>
        )}
      </div>
    </div>
  );
}