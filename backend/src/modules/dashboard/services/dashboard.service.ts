import { pool } from "../../../database/connection";

export async function obterResumoDashboardService(usuarioId: number) {
  const produtosResult = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM produtos
    WHERE usuario_id = $1
    AND ativo = TRUE
    `,
    [usuarioId]
  );

  const anunciosResult = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM anuncios
    WHERE usuario_id = $1
    AND status <> 'desativado'
    `,
    [usuarioId]
  );

  const estoqueBaixoResult = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM produtos
    WHERE usuario_id = $1
    AND ativo = TRUE
    AND estoque_atual <= estoque_minimo
    `,
    [usuarioId]
  );

  const vendasResult = await pool.query(
    `
    SELECT
      COALESCE(SUM(valor_bruto), 0) AS total_vendido,
      COALESCE(SUM(lucro), 0) AS lucro_total,
      COALESCE(AVG(margem_lucro), 0) AS margem_media
    FROM vendas
    WHERE usuario_id = $1
    `,
    [usuarioId]
  );

  return {
    total_produtos: Number(produtosResult.rows[0].total),
    total_anuncios: Number(anunciosResult.rows[0].total),
    estoque_baixo: Number(estoqueBaixoResult.rows[0].total),
    total_vendido: Number(vendasResult.rows[0].total_vendido),
    lucro_total: Number(vendasResult.rows[0].lucro_total),
    margem_media: Number(vendasResult.rows[0].margem_media)
  };
}