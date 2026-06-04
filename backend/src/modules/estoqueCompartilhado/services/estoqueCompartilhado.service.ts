import { pool } from "../../../database/connection";

export async function listarEstoqueCompartilhadoService(usuarioId: number) {
  const resultado = await pool.query(
    `
    SELECT
      p.id AS produto_id,
      p.sku,
      p.nome AS produto_nome,
      p.estoque_atual,
      p.estoque_minimo,
      p.custo_medio,
      COUNT(a.id) AS total_anuncios,
      COUNT(DISTINCT a.conta_mercado_livre_id) AS total_contas,
      COUNT(a.id) FILTER (WHERE a.sincronizado = FALSE) AS pendentes_sync,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'anuncio_id', a.id,
          'codigo_anuncio', a.codigo_anuncio,
          'titulo', a.titulo,
          'estoque_anuncio', a.estoque_anuncio,
          'estoque_sincronizado', a.estoque_sincronizado,
          'preco_venda', a.preco_venda,
          'status', a.status,
          'conta_id', c.id,
          'conta_nome', COALESCE(c.nome_conta, c.nickname)
        )
      ) FILTER (WHERE a.id IS NOT NULL) AS anuncios
    FROM produtos p
    LEFT JOIN anuncios a
      ON a.produto_id = p.id
      AND a.status <> 'desativado'
    LEFT JOIN contas_mercado_livre c
      ON c.id = a.conta_mercado_livre_id
    WHERE p.usuario_id = $1
    AND p.ativo = TRUE
    GROUP BY p.id
    ORDER BY p.sku ASC
    `,
    [usuarioId]
  );

  return resultado.rows;
}

export async function sincronizarSkuCompartilhadoService(
  usuarioId: number,
  produtoId: number
) {
  const produtoResult = await pool.query(
    `
    SELECT *
    FROM produtos
    WHERE id = $1
    AND usuario_id = $2
    AND ativo = TRUE
    `,
    [produtoId, usuarioId]
  );

  if (produtoResult.rows.length === 0) {
    throw new Error("Produto não encontrado");
  }

  const produto = produtoResult.rows[0];

  const anunciosResult = await pool.query(
    `
    SELECT *
    FROM anuncios
    WHERE usuario_id = $1
    AND produto_id = $2
    AND status <> 'desativado'
    AND conta_mercado_livre_id IS NOT NULL
    AND codigo_anuncio IS NOT NULL
    `,
    [usuarioId, produtoId]
  );

  let enfileirados = 0;

  await pool.query("BEGIN");

  try {
    for (const anuncio of anunciosResult.rows) {
      await pool.query(
        `
        UPDATE anuncios
        SET
          estoque_anuncio = $1,
          sincronizado = FALSE,
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
        VALUES ($1,$2,$3,'mercado_livre','estoque',$4)
        `,
        [
          usuarioId,
          anuncio.id,
          anuncio.conta_mercado_livre_id,
          JSON.stringify({
            produto_id: produto.id,
            sku: produto.sku,
            estoque: produto.estoque_atual,
            origem: "estoque_compartilhado"
          })
        ]
      );

      enfileirados++;
    }

    await pool.query("COMMIT");

    return {
      mensagem: "Estoque compartilhado enviado para sincronização",
      sku: produto.sku,
      estoque: produto.estoque_atual,
      anuncios_enfileirados: enfileirados
    };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}