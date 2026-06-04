import { pool } from "../../../database/connection";

function numero(valor: any): number {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function contarFotos(dadosApi: any): number {
  if (!dadosApi) return 0;

  const dados = typeof dadosApi === "string" ? JSON.parse(dadosApi) : dadosApi;

  if (Array.isArray(dados.pictures)) {
    return dados.pictures.length;
  }

  return 0;
}

function contarAtributos(dadosApi: any): number {
  if (!dadosApi) return 0;

  const dados = typeof dadosApi === "string" ? JSON.parse(dadosApi) : dadosApi;

  if (Array.isArray(dados.attributes)) {
    return dados.attributes.length;
  }

  return 0;
}

function calcularQualidade(anuncio: any) {
  const problemas: string[] = [];
  let pontos = 100;

  const titulo = anuncio.titulo || "";
  const descricao = anuncio.descricao || "";
  const preco = numero(anuncio.preco_venda);
  const estoque = numero(anuncio.estoque_anuncio);
  const lucro = numero(anuncio.lucro_estimado);
  const fotos = contarFotos(anuncio.dados_api);
  const atributos = contarAtributos(anuncio.dados_api);

  if (!anuncio.produto_id || anuncio.vinculo_sku_status === "pendente") {
    pontos -= 25;
    problemas.push("Anúncio sem SKU vinculado");
  }

  if (!titulo || titulo.length < 20) {
    pontos -= 10;
    problemas.push("Título muito curto");
  }

  if (!descricao || descricao.length < 100) {
    pontos -= 15;
    problemas.push("Descrição curta ou vazia");
  }

  if (preco <= 0) {
    pontos -= 15;
    problemas.push("Preço inválido");
  }

  if (estoque <= 0) {
    pontos -= 15;
    problemas.push("Estoque zerado");
  }

  if (lucro <= 0) {
    pontos -= 15;
    problemas.push("Lucro estimado negativo ou zerado");
  }

  if (!anuncio.categoria_ml) {
    pontos -= 10;
    problemas.push("Categoria Mercado Livre não identificada");
  }

  if (fotos < 3) {
    pontos -= 10;
    problemas.push("Poucas fotos no anúncio");
  }

  if (atributos < 5) {
    pontos -= 10;
    problemas.push("Ficha técnica com poucos atributos");
  }

  if (!anuncio.codigo_anuncio) {
    pontos -= 10;
    problemas.push("Anúncio sem código Mercado Livre");
  }

  const score = Math.max(0, Math.min(100, pontos));

  let status = "bom";

  if (score < 60) {
    status = "critico";
  } else if (score < 85) {
    status = "atencao";
  }

  return {
    score,
    status,
    problemas,
    fotos,
    atributos
  };
}

export async function atualizarQualidadeAnunciosService(
  usuarioId: number,
  contaMercadoLivreId?: number | null
) {
  let query = `
    SELECT *
    FROM anuncios
    WHERE usuario_id = $1
    AND status <> 'desativado'
  `;

  const params: any[] = [usuarioId];

  if (contaMercadoLivreId) {
    query += ` AND conta_mercado_livre_id = $2`;
    params.push(contaMercadoLivreId);
  }

  const anunciosResult = await pool.query(query, params);

  let analisados = 0;

  for (const anuncio of anunciosResult.rows) {
    const qualidade = calcularQualidade(anuncio);

    await pool.query(
      `
      UPDATE anuncios
      SET
        qualidade_score = $1,
        qualidade_status = $2,
        qualidade_problemas = $3,
        qualidade_atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $4
      AND usuario_id = $5
      `,
      [
        qualidade.score,
        qualidade.status,
        JSON.stringify(qualidade.problemas),
        anuncio.id,
        usuarioId
      ]
    );

    analisados++;
  }

  return {
    mensagem: "Qualidade recalculada com sucesso",
    analisados
  };
}

export async function obterResumoQualidadeService(
  usuarioId: number,
  contaMercadoLivreId?: number | null
) {
  let filtroConta = "";
  const params: any[] = [usuarioId];

  if (contaMercadoLivreId) {
    filtroConta = " AND conta_mercado_livre_id = $2";
    params.push(contaMercadoLivreId);
  }

  const resumoResult = await pool.query(
    `
    SELECT
      COUNT(*) AS total_anuncios,
      COUNT(*) FILTER (WHERE qualidade_status = 'bom') AS anuncios_bons,
      COUNT(*) FILTER (WHERE qualidade_status = 'atencao') AS anuncios_atencao,
      COUNT(*) FILTER (WHERE qualidade_status = 'critico') AS anuncios_criticos,
      COALESCE(AVG(qualidade_score), 0) AS score_geral,
      COUNT(*) FILTER (WHERE vinculo_sku_status = 'pendente' OR produto_id IS NULL) AS pendentes_sku,
      COUNT(*) FILTER (WHERE estoque_anuncio <= 0) AS estoque_zerado,
      COUNT(*) FILTER (WHERE lucro_estimado <= 0) AS lucro_ruim
    FROM anuncios
    WHERE usuario_id = $1
    AND status <> 'desativado'
    ${filtroConta}
    `,
    params
  );

  const categoriasResult = await pool.query(
    `
    SELECT
      COALESCE(categoria_ml, 'Sem categoria') AS categoria,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE qualidade_status = 'critico') AS criticos,
      COUNT(*) FILTER (WHERE vinculo_sku_status = 'pendente' OR produto_id IS NULL) AS pendentes_sku,
      COUNT(*) FILTER (WHERE estoque_anuncio <= 0) AS estoque_zerado,
      COALESCE(AVG(qualidade_score), 0) AS score_medio
    FROM anuncios
    WHERE usuario_id = $1
    AND status <> 'desativado'
    ${filtroConta}
    GROUP BY COALESCE(categoria_ml, 'Sem categoria')
    ORDER BY criticos DESC, total DESC
    `,
    params
  );

  return {
    resumo: {
      total_anuncios: Number(resumoResult.rows[0].total_anuncios),
      anuncios_bons: Number(resumoResult.rows[0].anuncios_bons),
      anuncios_atencao: Number(resumoResult.rows[0].anuncios_atencao),
      anuncios_criticos: Number(resumoResult.rows[0].anuncios_criticos),
      score_geral: Number(resumoResult.rows[0].score_geral),
      pendentes_sku: Number(resumoResult.rows[0].pendentes_sku),
      estoque_zerado: Number(resumoResult.rows[0].estoque_zerado),
      lucro_ruim: Number(resumoResult.rows[0].lucro_ruim)
    },
    categorias: categoriasResult.rows
  };
}

export async function listarAnunciosQualidadeService(
  usuarioId: number,
  contaMercadoLivreId?: number | null,
  status?: string
) {
  let query = `
    SELECT
      a.id,
      a.codigo_anuncio,
      a.titulo,
      a.sku_marketplace,
      a.preco_venda,
      a.estoque_anuncio,
      a.lucro_estimado,
      a.margem_estimada,
      a.categoria_ml,
      a.qualidade_score,
      a.qualidade_status,
      a.qualidade_problemas,
      a.vinculo_sku_status,
      c.nickname AS conta_nickname,
      c.nome_conta
    FROM anuncios a
    LEFT JOIN contas_mercado_livre c ON c.id = a.conta_mercado_livre_id
    WHERE a.usuario_id = $1
    AND a.status <> 'desativado'
  `;

  const params: any[] = [usuarioId];

  if (contaMercadoLivreId) {
    query += ` AND a.conta_mercado_livre_id = $${params.length + 1}`;
    params.push(contaMercadoLivreId);
  }

  if (status && status !== "todos") {
    query += ` AND a.qualidade_status = $${params.length + 1}`;
    params.push(status);
  }

  query += ` ORDER BY a.qualidade_score ASC, a.id DESC`;

  const resultado = await pool.query(query, params);

  return resultado.rows;
}