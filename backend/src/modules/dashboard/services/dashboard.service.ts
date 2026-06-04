import { pool } from "../../../database/connection";

export async function obterResumoDashboardService(
  usuarioId: number,
  contaMercadoLivreId?: number | null
) {
  const params: any[] = [usuarioId];

  let filtroContaVendas = "";
  let filtroContaAnuncios = "";

  if (contaMercadoLivreId) {
    params.push(contaMercadoLivreId);
    filtroContaVendas = " AND conta_mercado_livre_id = $2";
    filtroContaAnuncios = " AND conta_mercado_livre_id = $2";
  }

  const resumoVendas = await pool.query(
    `
    SELECT
      COALESCE(SUM(valor_bruto), 0) AS total_vendido,
      COALESCE(SUM(lucro), 0) AS lucro_total,
      COALESCE(AVG(margem_lucro), 0) AS margem_media,
      COUNT(*) AS total_vendas
    FROM vendas
    WHERE usuario_id = $1
    ${filtroContaVendas}
    `,
    params
  );

  const resumoVendas30Dias = await pool.query(
    `
    SELECT
      COALESCE(SUM(valor_bruto), 0) AS total_vendido_30_dias,
      COALESCE(SUM(lucro), 0) AS lucro_30_dias,
      COUNT(*) AS vendas_30_dias
    FROM vendas
    WHERE usuario_id = $1
    AND data_venda >= NOW() - INTERVAL '30 days'
    ${filtroContaVendas}
    `,
    params
  );

  const produtos = await pool.query(
    `
    SELECT COUNT(*) AS total_produtos
    FROM produtos
    WHERE usuario_id = $1
    AND ativo = TRUE
    `,
    [usuarioId]
  );

  const estoqueBaixo = await pool.query(
    `
    SELECT COUNT(*) AS estoque_baixo
    FROM produtos
    WHERE usuario_id = $1
    AND ativo = TRUE
    AND estoque_atual <= estoque_minimo
    `,
    [usuarioId]
  );

  const valorEstoque = await pool.query(
    `
    SELECT
      COALESCE(SUM(estoque_atual * custo_medio), 0) AS valor_estoque
    FROM produtos
    WHERE usuario_id = $1
    AND ativo = TRUE
    `,
    [usuarioId]
  );

  const anuncios = await pool.query(
    `
    SELECT
      COUNT(*) AS total_anuncios,
      COUNT(*) FILTER (WHERE status = 'active' OR status = 'ativo') AS anuncios_ativos,
      COUNT(*) FILTER (WHERE status = 'paused' OR status = 'pausado') AS anuncios_pausados,
      COUNT(*) FILTER (WHERE produto_id IS NULL OR vinculo_sku_status = 'pendente') AS anuncios_sem_sku,
      COUNT(*) FILTER (WHERE estoque_anuncio <= 0) AS anuncios_sem_estoque,
      COUNT(*) FILTER (WHERE sincronizado = FALSE) AS anuncios_pendentes_sync
    FROM anuncios
    WHERE usuario_id = $1
    AND status <> 'desativado'
    ${filtroContaAnuncios}
    `,
    params
  );

  const sincronizacao = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE status = 'pendente') AS sync_pendente,
      COUNT(*) FILTER (WHERE status = 'erro') AS sync_erro,
      COUNT(*) FILTER (WHERE status = 'enviado') AS sync_enviado
    FROM fila_sincronizacao
    WHERE usuario_id = $1
    `,
    [usuarioId]
  );

  const qualidade = await pool.query(
    `
    SELECT
      COALESCE(AVG(qualidade_score), 0) AS qualidade_media,
      COUNT(*) FILTER (WHERE qualidade_status = 'critico') AS qualidade_criticos
    FROM anuncios
    WHERE usuario_id = $1
    AND status <> 'desativado'
    ${filtroContaAnuncios}
    `,
    params
  );

  const topProdutos = await pool.query(
    `
    SELECT
      p.sku,
      p.nome,
      COALESCE(SUM(v.quantidade), 0) AS quantidade_vendida,
      COALESCE(SUM(v.valor_bruto), 0) AS faturamento,
      COALESCE(SUM(v.lucro), 0) AS lucro
    FROM vendas v
    JOIN produtos p ON p.id = v.produto_id
    WHERE v.usuario_id = $1
    AND v.data_venda >= NOW() - INTERVAL '30 days'
    ${filtroContaVendas}
    GROUP BY p.sku, p.nome
    ORDER BY quantidade_vendida DESC
    LIMIT 5
    `,
    params
  );

  const topAnuncios = await pool.query(
    `
    SELECT
      a.codigo_anuncio,
      a.titulo,
      COALESCE(SUM(v.quantidade), 0) AS quantidade_vendida,
      COALESCE(SUM(v.valor_bruto), 0) AS faturamento,
      COALESCE(SUM(v.lucro), 0) AS lucro
    FROM vendas v
    LEFT JOIN anuncios a ON a.id = v.anuncio_id
    WHERE v.usuario_id = $1
    AND v.data_venda >= NOW() - INTERVAL '30 days'
    ${filtroContaVendas}
    GROUP BY a.codigo_anuncio, a.titulo
    ORDER BY faturamento DESC
    LIMIT 5
    `,
    params
  );

  const ultimasVendas = await pool.query(
    `
    SELECT
      v.id,
      v.codigo_venda,
      v.valor_bruto,
      v.lucro,
      v.margem_lucro,
      v.data_venda,
      p.sku,
      p.nome AS produto_nome
    FROM vendas v
    JOIN produtos p ON p.id = v.produto_id
    WHERE v.usuario_id = $1
    ${filtroContaVendas}
    ORDER BY v.id DESC
    LIMIT 5
    `,
    params
  );

  return {
    resumo: {
      total_vendido: Number(resumoVendas.rows[0].total_vendido),
      lucro_total: Number(resumoVendas.rows[0].lucro_total),
      margem_media: Number(resumoVendas.rows[0].margem_media),
      total_vendas: Number(resumoVendas.rows[0].total_vendas),

      total_vendido_30_dias: Number(
        resumoVendas30Dias.rows[0].total_vendido_30_dias
      ),
      lucro_30_dias: Number(resumoVendas30Dias.rows[0].lucro_30_dias),
      vendas_30_dias: Number(resumoVendas30Dias.rows[0].vendas_30_dias),

      total_produtos: Number(produtos.rows[0].total_produtos),
      estoque_baixo: Number(estoqueBaixo.rows[0].estoque_baixo),
      valor_estoque: Number(valorEstoque.rows[0].valor_estoque),

      total_anuncios: Number(anuncios.rows[0].total_anuncios),
      anuncios_ativos: Number(anuncios.rows[0].anuncios_ativos),
      anuncios_pausados: Number(anuncios.rows[0].anuncios_pausados),
      anuncios_sem_sku: Number(anuncios.rows[0].anuncios_sem_sku),
      anuncios_sem_estoque: Number(anuncios.rows[0].anuncios_sem_estoque),
      anuncios_pendentes_sync: Number(anuncios.rows[0].anuncios_pendentes_sync),

      sync_pendente: Number(sincronizacao.rows[0].sync_pendente),
      sync_erro: Number(sincronizacao.rows[0].sync_erro),
      sync_enviado: Number(sincronizacao.rows[0].sync_enviado),

      qualidade_media: Number(qualidade.rows[0].qualidade_media),
      qualidade_criticos: Number(qualidade.rows[0].qualidade_criticos)
    },
    top_produtos: topProdutos.rows,
    top_anuncios: topAnuncios.rows,
    ultimas_vendas: ultimasVendas.rows
  };
}