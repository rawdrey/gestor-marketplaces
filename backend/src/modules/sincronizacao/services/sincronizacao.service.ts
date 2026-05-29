import { pool } from "../../../database/connection";

async function usuarioSincronizaMulticonta(usuarioId: number) {
  const resultado = await pool.query(
    `
    SELECT sincronizar_estoque_multiconta
    FROM configuracoes_usuario
    WHERE usuario_id = $1
    `,
    [usuarioId]
  );

  return Boolean(resultado.rows[0]?.sincronizar_estoque_multiconta);
}

export async function sincronizarEstoqueProduto(
  usuarioId: number,
  produtoId: number,
  contaMercadoLivreId?: number | null
) {
  const produtoResult = await pool.query(
    `
    SELECT *
    FROM produtos
    WHERE id = $1
    AND usuario_id = $2
    `,
    [produtoId, usuarioId]
  );

  if (produtoResult.rows.length === 0) return;

  const produto = produtoResult.rows[0];
  const sincronizarMulticonta = await usuarioSincronizaMulticonta(usuarioId);

  let query = `
    SELECT *
    FROM anuncios
    WHERE usuario_id = $1
    AND status <> 'desativado'
    AND sku_marketplace = $2
  `;

  const params: any[] = [usuarioId, produto.sku];

  if (!sincronizarMulticonta && contaMercadoLivreId) {
    query += ` AND conta_mercado_livre_id = $3`;
    params.push(contaMercadoLivreId);
  }

  const anunciosResult = await pool.query(query, params);

  for (const anuncio of anunciosResult.rows) {
    await pool.query(
      `
      UPDATE anuncios
      SET
        estoque_anuncio = $1,
        estoque_sincronizado = $1,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $2
      AND usuario_id = $3
      `,
      [produto.estoque_atual, anuncio.id, usuarioId]
    );

    await pool.query(
      `
      INSERT INTO fila_sincronizacao
      (
        usuario_id,
        anuncio_id,
        conta_mercado_livre_id,
        marketplace,
        tipo,
        payload
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        usuarioId,
        anuncio.id,
        anuncio.conta_mercado_livre_id || null,
        anuncio.marketplace,
        "estoque",
        JSON.stringify({
          produto_id: produto.id,
          sku: produto.sku,
          estoque: produto.estoque_atual,
          sincronizar_multiconta: sincronizarMulticonta
        })
      ]
    );
  }
}