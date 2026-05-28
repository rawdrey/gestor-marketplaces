import { pool } from "../../../database/connection";

export async function sincronizarEstoqueProduto(
  usuarioId: number,
  produtoId: number
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

  if (produtoResult.rows.length === 0) {
    return;
  }

  const produto = produtoResult.rows[0];

  const anunciosResult = await pool.query(
    `
    SELECT *
    FROM anuncios
    WHERE produto_id = $1
    AND usuario_id = $2
    AND status <> 'desativado'
    `,
    [produtoId, usuarioId]
  );

  for (const anuncio of anunciosResult.rows) {
    await pool.query(
      `
      UPDATE anuncios
      SET
        estoque_anuncio = $1,
        estoque_sincronizado = $1,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [produto.estoque_atual, anuncio.id]
    );

    await pool.query(
      `
      INSERT INTO fila_sincronizacao
      (
        usuario_id,
        anuncio_id,
        marketplace,
        tipo,
        payload
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        usuarioId,
        anuncio.id,
        anuncio.marketplace,
        "estoque",
        JSON.stringify({
          produto_id: produto.id,
          estoque: produto.estoque_atual
        })
      ]
    );
  }
}