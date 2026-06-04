import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

interface ResumoQualidade {
  total_anuncios: number;
  anuncios_bons: number;
  anuncios_atencao: number;
  anuncios_criticos: number;
  score_geral: number;
  pendentes_sku: number;
  estoque_zerado: number;
  lucro_ruim: number;
}

interface CategoriaQualidade {
  categoria: string;
  total: number;
  criticos: number;
  pendentes_sku: number;
  estoque_zerado: number;
  score_medio: number;
}

interface AnuncioQualidade {
  id: number;
  codigo_anuncio?: string;
  titulo: string;
  sku_marketplace?: string;
  preco_venda: number;
  estoque_anuncio: number;
  lucro_estimado: number;
  margem_estimada: number;
  categoria_ml?: string;
  qualidade_score: number;
  qualidade_status: string;
  qualidade_problemas?: string[] | string;
  vinculo_sku_status?: string;
  conta_nickname?: string;
  nome_conta?: string;
}

export function Qualidade() {
  const [resumo, setResumo] = useState<ResumoQualidade>({
    total_anuncios: 0,
    anuncios_bons: 0,
    anuncios_atencao: 0,
    anuncios_criticos: 0,
    score_geral: 0,
    pendentes_sku: 0,
    estoque_zerado: 0,
    lucro_ruim: 0
  });

  const [categorias, setCategorias] = useState<CategoriaQualidade[]>([]);
  const [anuncios, setAnuncios] = useState<AnuncioQualidade[]>([]);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    const resumoResponse = await api.get("/qualidade/resumo");
    setResumo(resumoResponse.data.resumo);
    setCategorias(resumoResponse.data.categorias);

    const anunciosResponse = await api.get("/qualidade/anuncios", {
      params: {
        status: filtroStatus
      }
    });

    setAnuncios(anunciosResponse.data);
  }

  async function atualizarQualidade() {
    setMensagem("Atualizando qualidade dos anúncios...");

    const response = await api.post("/qualidade/atualizar");

    setMensagem(`Qualidade atualizada. Analisados: ${response.data.analisados}.`);

    carregar();
  }

  useEffect(() => {
    carregar();
  }, [filtroStatus]);

  const completudeGeral = useMemo(() => {
    return Number(resumo.score_geral || 0).toFixed(0);
  }, [resumo]);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function statusClasse(status: string) {
    if (status === "bom") return "text-green-700";
    if (status === "atencao") return "text-yellow-600";
    return "text-red-600";
  }

  function problemasLista(problemas: any): string[] {
    if (!problemas) return [];

    if (Array.isArray(problemas)) return problemas;

    try {
      return JSON.parse(problemas);
    } catch {
      return [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Central de Qualidade</h2>
          <p className="text-gray-500">
            Diagnóstico de completude, SKU, estoque, lucro e ficha técnica dos anúncios.
          </p>
        </div>

        <button
          onClick={atualizarQualidade}
          className="bg-blue-700 text-white rounded-xl px-5 py-3 font-bold"
        >
          Recalcular qualidade
        </button>
      </div>

      {mensagem && (
        <div className="bg-white rounded-2xl shadow p-4">
          {mensagem}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Total de anúncios</p>
          <strong className="text-3xl">{resumo.total_anuncios}</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Completude geral</p>
          <strong className="text-3xl">{completudeGeral}%</strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Críticos</p>
          <strong className="text-3xl text-red-600">
            {resumo.anuncios_criticos}
          </strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Atenção</p>
          <strong className="text-3xl text-yellow-600">
            {resumo.anuncios_atencao}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Pendentes de SKU</p>
          <strong className="text-2xl text-red-600">
            {resumo.pendentes_sku}
          </strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Estoque zerado</p>
          <strong className="text-2xl text-red-600">
            {resumo.estoque_zerado}
          </strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Lucro ruim</p>
          <strong className="text-2xl text-red-600">
            {resumo.lucro_ruim}
          </strong>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-500">Bons</p>
          <strong className="text-2xl text-green-700">
            {resumo.anuncios_bons}
          </strong>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-bold mb-4">Categorias com problema</h3>

        <div className="grid grid-cols-1 gap-3">
          {categorias.map((categoria) => (
            <div
              key={categoria.categoria}
              className="border rounded-xl p-4 grid grid-cols-2 md:grid-cols-6 gap-3 text-sm"
            >
              <div className="md:col-span-2">
                <p className="text-gray-500">Categoria</p>
                <strong>{categoria.categoria}</strong>
              </div>

              <div>
                <p className="text-gray-500">Anúncios</p>
                <strong>{categoria.total}</strong>
              </div>

              <div>
                <p className="text-gray-500">Críticos</p>
                <strong className="text-red-600">{categoria.criticos}</strong>
              </div>

              <div>
                <p className="text-gray-500">Pendentes SKU</p>
                <strong>{categoria.pendentes_sku}</strong>
              </div>

              <div>
                <p className="text-gray-500">Score</p>
                <strong>{Number(categoria.score_medio).toFixed(0)}%</strong>
              </div>
            </div>
          ))}

          {categorias.length === 0 && (
            <p className="text-gray-500">Nenhuma categoria encontrada.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 flex flex-col md:flex-row gap-3">
        <select
          className="border rounded-xl p-3"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="critico">Críticos</option>
          <option value="atencao">Atenção</option>
          <option value="bom">Bons</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {anuncios.map((anuncio) => {
          const problemas = problemasLista(anuncio.qualidade_problemas);

          return (
            <div key={anuncio.id} className="bg-white rounded-2xl shadow p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {anuncio.codigo_anuncio || "Sem MLB"} |{" "}
                    {anuncio.categoria_ml || "Sem categoria"}
                  </p>

                  <h3 className="font-bold text-lg">{anuncio.titulo}</h3>

                  <p className="text-gray-500">
                    SKU ML: {anuncio.sku_marketplace || "vazio"} | Conta:{" "}
                    {anuncio.nome_conta ||
                      anuncio.conta_nickname ||
                      "Sem conta"}
                  </p>
                </div>

                <div>
                  <strong className={statusClasse(anuncio.qualidade_status)}>
                    {anuncio.qualidade_status}
                  </strong>

                  <p className="text-2xl font-bold">
                    {Number(anuncio.qualidade_score || 0).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-4">
                <div>
                  <p className="text-gray-500">Preço</p>
                  <strong>{moeda(anuncio.preco_venda)}</strong>
                </div>

                <div>
                  <p className="text-gray-500">Estoque</p>
                  <strong>{anuncio.estoque_anuncio}</strong>
                </div>

                <div>
                  <p className="text-gray-500">Lucro</p>
                  <strong>{moeda(anuncio.lucro_estimado)}</strong>
                </div>

                <div>
                  <p className="text-gray-500">Margem</p>
                  <strong>
                    {Number(anuncio.margem_estimada || 0).toFixed(2)}%
                  </strong>
                </div>
              </div>

              {problemas.length > 0 && (
                <div className="mt-4 bg-red-50 rounded-xl p-3 text-sm text-red-700">
                  <strong>Problemas encontrados:</strong>

                  <ul className="list-disc ml-5 mt-2">
                    {problemas.map((problema, index) => (
                      <li key={index}>{problema}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}

        {anuncios.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            Nenhum anúncio encontrado.
          </div>
        )}
      </div>
    </div>
  );
}