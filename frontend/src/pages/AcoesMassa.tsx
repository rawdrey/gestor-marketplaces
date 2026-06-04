import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

interface Anuncio {
  id: number;
  codigo_anuncio?: string;
  titulo: string;
  sku_marketplace?: string;
  preco_venda: number;
  estoque_anuncio: number;
  status: string;
  categoria_ml?: string;
  qualidade_score?: number;
  qualidade_status?: string;
  sincronizado: boolean;
  conta_nickname?: string;
  nome_conta?: string;
}

export function AcoesMassa() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroSku, setFiltroSku] = useState("todos");
  const [filtroQualidade, setFiltroQualidade] = useState("todos");
  const [mensagem, setMensagem] = useState("");

  const [operacaoPreco, setOperacaoPreco] = useState("aumentar");
  const [tipoPreco, setTipoPreco] = useState("percentual");
  const [valorPreco, setValorPreco] = useState(0);

  const [modoEstoque, setModoEstoque] = useState("definir");
  const [valorEstoque, setValorEstoque] = useState(0);

  const [modoTitulo, setModoTitulo] = useState("prefixo");
  const [valorTitulo, setValorTitulo] = useState("");
  const [procurarTitulo, setProcurarTitulo] = useState("");

  const [modoDescricao, setModoDescricao] = useState("sufixo");
  const [valorDescricao, setValorDescricao] = useState("");
  const [procurarDescricao, setProcurarDescricao] = useState("");

  const [fotosTexto, setFotosTexto] = useState("");

  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [cor, setCor] = useState("");
  const [gtin, setGtin] = useState("");

  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [largura, setLargura] = useState("");
  const [comprimento, setComprimento] = useState("");

  async function carregar() {
    const response = await api.get("/acoes-massa/anuncios");
    setAnuncios(response.data);
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = anuncios.filter((a) => {
    const texto = busca.toLowerCase();

    const bateBusca =
      a.titulo?.toLowerCase().includes(texto) ||
      a.sku_marketplace?.toLowerCase().includes(texto) ||
      a.codigo_anuncio?.toLowerCase().includes(texto);

    const bateStatus =
      filtroStatus === "todos" ||
      a.status === filtroStatus ||
      (filtroStatus === "active" && a.status === "ativo") ||
      (filtroStatus === "paused" && a.status === "pausado");

    const bateSku =
      filtroSku === "todos" ||
      (filtroSku === "com_sku" && !!a.sku_marketplace) ||
      (filtroSku === "sem_sku" && !a.sku_marketplace);

    const bateQualidade =
      filtroQualidade === "todos" ||
      a.qualidade_status === filtroQualidade;

    return bateBusca && bateStatus && bateSku && bateQualidade;
  });

  const metricas = useMemo(() => {
    const ativos = anuncios.filter(
      (a) => a.status === "active" || a.status === "ativo"
    ).length;

    const pausados = anuncios.filter(
      (a) => a.status === "paused" || a.status === "pausado"
    ).length;

    const estoqueTotal = filtrados.reduce(
      (s, a) => s + Number(a.estoque_anuncio || 0),
      0
    );

    const precoMedio =
      filtrados.length > 0
        ? filtrados.reduce((s, a) => s + Number(a.preco_venda || 0), 0) /
          filtrados.length
        : 0;

    return {
      total: anuncios.length,
      selecionados: selecionados.length,
      ativos,
      pausados,
      estoqueTotal,
      precoMedio
    };
  }, [anuncios, filtrados, selecionados]);

  function alternar(id: number) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]
    );
  }

  function selecionarFiltrados() {
    const ids = filtrados.map((a) => a.id);
    const todosSelecionados = ids.every((id) => selecionados.includes(id));

    if (todosSelecionados) {
      setSelecionados((atual) => atual.filter((id) => !ids.includes(id)));
    } else {
      setSelecionados((atual) => Array.from(new Set([...atual, ...ids])));
    }
  }

  function limparSelecao() {
    setSelecionados([]);
  }

  async function reajustarPreco(event: FormEvent) {
    event.preventDefault();

    const response = await api.post("/acoes-massa/preco", {
      anuncio_ids: selecionados,
      operacao: operacaoPreco,
      tipo_reajuste: tipoPreco,
      valor_reajuste: valorPreco,
      enviar_sync: true
    });

    setMensagem(
      `Preço atualizado. Atualizados: ${response.data.atualizados}. Enfileirados: ${response.data.enfileirados}.`
    );

    setSelecionados([]);
    carregar();
  }

  async function alterarEstoque(event: FormEvent) {
    event.preventDefault();

    const response = await api.post("/acoes-massa/estoque", {
      anuncio_ids: selecionados,
      modo: modoEstoque,
      valor: valorEstoque,
      enviar_sync: true
    });

    setMensagem(
      `Estoque atualizado. Atualizados: ${response.data.atualizados}. Enfileirados: ${response.data.enfileirados}.`
    );

    setSelecionados([]);
    carregar();
  }

  async function alterarTitulo(event: FormEvent) {
    event.preventDefault();

    const response = await api.post("/acoes-massa/titulo", {
      anuncio_ids: selecionados,
      modo: modoTitulo,
      valor: valorTitulo,
      procurar: procurarTitulo,
      enviar_sync: true
    });

    setMensagem(
      `Títulos atualizados. Atualizados: ${response.data.atualizados}. Enfileirados: ${response.data.enfileirados}.`
    );

    setSelecionados([]);
    carregar();
  }

  async function alterarDescricao(event: FormEvent) {
    event.preventDefault();

    const response = await api.post("/acoes-massa/descricao", {
      anuncio_ids: selecionados,
      modo: modoDescricao,
      valor: valorDescricao,
      procurar: procurarDescricao,
      enviar_sync: true
    });

    setMensagem(
      `Descrições atualizadas. Atualizadas: ${response.data.atualizados}. Enfileiradas: ${response.data.enfileirados}.`
    );

    setSelecionados([]);
    carregar();
  }

  async function alterarFotos(event: FormEvent) {
    event.preventDefault();

    const fotos = fotosTexto
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const response = await api.post("/acoes-massa/fotos", {
      anuncio_ids: selecionados,
      fotos,
      modo: "substituir",
      enviar_sync: true
    });

    setMensagem(
      `Fotos atualizadas. Atualizados: ${response.data.atualizados}. Enfileirados: ${response.data.enfileirados}.`
    );

    setSelecionados([]);
    carregar();
  }

  async function alterarAtributos(event: FormEvent) {
    event.preventDefault();

    const response = await api.post("/acoes-massa/atributos", {
      anuncio_ids: selecionados,
      marca,
      modelo,
      cor,
      gtin,
      enviar_sync: true
    });

    setMensagem(
      `Atributos atualizados. Atualizados: ${response.data.atualizados}. Enfileirados: ${response.data.enfileirados}.`
    );

    setSelecionados([]);
    carregar();
  }

  async function alterarMedidas(event: FormEvent) {
    event.preventDefault();

    const response = await api.post("/acoes-massa/medidas", {
      anuncio_ids: selecionados,
      peso,
      altura,
      largura,
      comprimento,
      enviar_sync: true
    });

    setMensagem(
      `Medidas atualizadas. Atualizados: ${response.data.atualizados}. Enfileirados: ${response.data.enfileirados}.`
    );

    setSelecionados([]);
    carregar();
  }

  async function acaoSimples(tipo: "pausar" | "ativar" | "sincronizar") {
    const response = await api.post(`/acoes-massa/${tipo}`, {
      anuncio_ids: selecionados
    });

    setMensagem(response.data.mensagem || "Ação concluída.");
    setSelecionados([]);
    carregar();
  }

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h2 className="text-2xl font-bold">Central de Ações em Massa</h2>
        <p className="text-gray-500">
          Selecione anúncios, filtre e aplique operações em lote.
        </p>
      </div>

      {mensagem && (
        <div className="bg-white rounded-2xl shadow p-4">{mensagem}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card titulo="Total" valor={metricas.total} />
        <Card titulo="Selecionados" valor={metricas.selecionados} />
        <Card titulo="Ativos" valor={metricas.ativos} />
        <Card titulo="Pausados" valor={metricas.pausados} />
        <Card titulo="Estoque total" valor={metricas.estoqueTotal} />
        <Card titulo="Preço médio" valor={moeda(metricas.precoMedio)} />
      </div>

      <div className="bg-white rounded-2xl shadow p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          className="border rounded-xl p-3 md:col-span-2"
          placeholder="Buscar por título, SKU ou MLB"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <select
          className="border rounded-xl p-3"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="todos">Todos status</option>
          <option value="active">Ativos</option>
          <option value="paused">Pausados</option>
        </select>

        <select
          className="border rounded-xl p-3"
          value={filtroSku}
          onChange={(e) => setFiltroSku(e.target.value)}
        >
          <option value="todos">Todos SKUs</option>
          <option value="com_sku">Com SKU</option>
          <option value="sem_sku">Sem SKU</option>
        </select>

        <select
          className="border rounded-xl p-3"
          value={filtroQualidade}
          onChange={(e) => setFiltroQualidade(e.target.value)}
        >
          <option value="todos">Todas qualidades</option>
          <option value="critico">Crítico</option>
          <option value="atencao">Atenção</option>
          <option value="bom">Bom</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 flex flex-col md:flex-row gap-3">
        <button
          onClick={selecionarFiltrados}
          className="bg-gray-900 text-white rounded-xl p-3 font-bold"
        >
          Selecionar filtrados
        </button>

        <button
          onClick={limparSelecao}
          className="border rounded-xl p-3 font-bold"
        >
          Limpar seleção
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtrados.map((anuncio) => {
          const selecionado = selecionados.includes(anuncio.id);

          return (
            <div
              key={anuncio.id}
              className={
                selecionado
                  ? "bg-blue-50 border border-blue-300 rounded-2xl shadow p-4"
                  : "bg-white rounded-2xl shadow p-4"
              }
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {anuncio.codigo_anuncio || "Sem MLB"} |{" "}
                    {anuncio.categoria_ml || "Sem categoria"}
                  </p>

                  <h3 className="font-bold text-lg">{anuncio.titulo}</h3>

                  <p className="text-gray-500">
                    SKU: {anuncio.sku_marketplace || "vazio"} | Conta:{" "}
                    {anuncio.nome_conta || anuncio.conta_nickname || "Sem conta"}
                  </p>
                </div>

                <button
                  onClick={() => alternar(anuncio.id)}
                  className={
                    selecionado
                      ? "bg-blue-700 text-white px-4 py-3 rounded-xl font-bold"
                      : "bg-gray-900 text-white px-4 py-3 rounded-xl font-bold"
                  }
                >
                  {selecionado ? "Selecionado" : "Selecionar"}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-sm">
                <Info titulo="Preço" valor={moeda(anuncio.preco_venda)} />
                <Info titulo="Estoque" valor={anuncio.estoque_anuncio} />
                <Info titulo="Status" valor={anuncio.status} />
                <Info
                  titulo="Qualidade"
                  valor={`${Number(anuncio.qualidade_score || 0).toFixed(0)}%`}
                />
                <Info titulo="Sync" valor={anuncio.sincronizado ? "Sim" : "Não"} />
              </div>
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Nenhum anúncio encontrado.
          </div>
        )}
      </div>

      {selecionados.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-xl overflow-y-auto max-h-[85vh]">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>{selecionados.length} anúncio(s) selecionado(s)</strong>

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => acaoSimples("pausar")}
                  className="bg-red-600 px-4 py-2 rounded-xl font-bold"
                >
                  Pausar
                </button>

                <button
                  onClick={() => acaoSimples("ativar")}
                  className="bg-green-600 px-4 py-2 rounded-xl font-bold"
                >
                  Ativar
                </button>

                <button
                  onClick={() => acaoSimples("sincronizar")}
                  className="bg-blue-600 px-4 py-2 rounded-xl font-bold"
                >
                  Enviar Sync
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <form
                onSubmit={reajustarPreco}
                className="bg-gray-800 rounded-xl p-3 grid gap-2"
              >
                <strong>Preço</strong>

                <select
                  className="text-gray-900 rounded-lg p-2"
                  value={operacaoPreco}
                  onChange={(e) => setOperacaoPreco(e.target.value)}
                >
                  <option value="aumentar">Aumentar</option>
                  <option value="reduzir">Reduzir</option>
                </select>

                <select
                  className="text-gray-900 rounded-lg p-2"
                  value={tipoPreco}
                  onChange={(e) => setTipoPreco(e.target.value)}
                >
                  <option value="percentual">Percentual</option>
                  <option value="valor">Valor fixo</option>
                </select>

                <input
                  className="text-gray-900 rounded-lg p-2"
                  type="number"
                  step="0.01"
                  value={valorPreco}
                  onChange={(e) => setValorPreco(Number(e.target.value))}
                />

                <button className="bg-yellow-400 text-gray-900 rounded-lg p-2 font-bold">
                  Aplicar preço
                </button>
              </form>

              <form
                onSubmit={alterarEstoque}
                className="bg-gray-800 rounded-xl p-3 grid gap-2"
              >
                <strong>Estoque</strong>

                <select
                  className="text-gray-900 rounded-lg p-2"
                  value={modoEstoque}
                  onChange={(e) => setModoEstoque(e.target.value)}
                >
                  <option value="definir">Definir</option>
                  <option value="somar">Somar</option>
                  <option value="subtrair">Subtrair</option>
                </select>

                <input
                  className="text-gray-900 rounded-lg p-2"
                  type="number"
                  value={valorEstoque}
                  onChange={(e) => setValorEstoque(Number(e.target.value))}
                />

                <button className="bg-yellow-400 text-gray-900 rounded-lg p-2 font-bold">
                  Aplicar estoque
                </button>
              </form>

              <form
                onSubmit={alterarTitulo}
                className="bg-gray-800 rounded-xl p-3 grid gap-2"
              >
                <strong>Título</strong>

                <select
                  className="text-gray-900 rounded-lg p-2"
                  value={modoTitulo}
                  onChange={(e) => setModoTitulo(e.target.value)}
                >
                  <option value="prefixo">Adicionar no início</option>
                  <option value="sufixo">Adicionar no final</option>
                  <option value="substituir">Substituir trecho</option>
                  <option value="trocar_tudo">Trocar título inteiro</option>
                </select>

                {modoTitulo === "substituir" && (
                  <input
                    className="text-gray-900 rounded-lg p-2"
                    placeholder="Procurar"
                    value={procurarTitulo}
                    onChange={(e) => setProcurarTitulo(e.target.value)}
                  />
                )}

                <input
                  className="text-gray-900 rounded-lg p-2"
                  placeholder="Texto"
                  value={valorTitulo}
                  onChange={(e) => setValorTitulo(e.target.value)}
                />

                <button className="bg-yellow-400 text-gray-900 rounded-lg p-2 font-bold">
                  Aplicar título
                </button>
              </form>

              <form
                onSubmit={alterarDescricao}
                className="bg-gray-800 rounded-xl p-3 grid gap-2"
              >
                <strong>Descrição</strong>

                <select
                  className="text-gray-900 rounded-lg p-2"
                  value={modoDescricao}
                  onChange={(e) => setModoDescricao(e.target.value)}
                >
                  <option value="prefixo">Adicionar no início</option>
                  <option value="sufixo">Adicionar no final</option>
                  <option value="substituir">Substituir trecho</option>
                  <option value="trocar_tudo">Trocar descrição inteira</option>
                </select>

                {modoDescricao === "substituir" && (
                  <input
                    className="text-gray-900 rounded-lg p-2"
                    placeholder="Procurar"
                    value={procurarDescricao}
                    onChange={(e) => setProcurarDescricao(e.target.value)}
                  />
                )}

                <textarea
                  className="text-gray-900 rounded-lg p-2"
                  placeholder="Texto"
                  value={valorDescricao}
                  onChange={(e) => setValorDescricao(e.target.value)}
                />

                <button className="bg-yellow-400 text-gray-900 rounded-lg p-2 font-bold">
                  Aplicar descrição
                </button>
              </form>

              <form
                onSubmit={alterarFotos}
                className="bg-gray-800 rounded-xl p-3 grid gap-2"
              >
                <strong>Fotos</strong>

                <textarea
                  className="text-gray-900 rounded-lg p-2"
                  placeholder="Cole uma URL de foto por linha"
                  value={fotosTexto}
                  onChange={(e) => setFotosTexto(e.target.value)}
                />

                <button className="bg-yellow-400 text-gray-900 rounded-lg p-2 font-bold">
                  Aplicar fotos
                </button>
              </form>

              <form
                onSubmit={alterarAtributos}
                className="bg-gray-800 rounded-xl p-3 grid gap-2"
              >
                <strong>Atributos</strong>

                <input
                  className="text-gray-900 rounded-lg p-2"
                  placeholder="Marca"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                />

                <input
                  className="text-gray-900 rounded-lg p-2"
                  placeholder="Modelo"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                />

                <input
                  className="text-gray-900 rounded-lg p-2"
                  placeholder="Cor"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                />

                <input
                  className="text-gray-900 rounded-lg p-2"
                  placeholder="GTIN/EAN"
                  value={gtin}
                  onChange={(e) => setGtin(e.target.value)}
                />

                <button className="bg-yellow-400 text-gray-900 rounded-lg p-2 font-bold">
                  Aplicar atributos
                </button>
              </form>

              <form
                onSubmit={alterarMedidas}
                className="bg-gray-800 rounded-xl p-3 grid gap-2"
              >
                <strong>Medidas</strong>

                <input
                  className="text-gray-900 rounded-lg p-2"
                  placeholder="Peso em gramas"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                />

                <input
                  className="text-gray-900 rounded-lg p-2"
                  placeholder="Altura em cm"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                />

                <input
                  className="text-gray-900 rounded-lg p-2"
                  placeholder="Largura em cm"
                  value={largura}
                  onChange={(e) => setLargura(e.target.value)}
                />

                <input
                  className="text-gray-900 rounded-lg p-2"
                  placeholder="Comprimento em cm"
                  value={comprimento}
                  onChange={(e) => setComprimento(e.target.value)}
                />

                <button className="bg-yellow-400 text-gray-900 rounded-lg p-2 font-bold">
                  Aplicar medidas
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: any }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <p className="text-gray-500">{titulo}</p>
      <strong className="text-2xl">{valor || 0}</strong>
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