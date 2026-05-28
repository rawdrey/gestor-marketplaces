import { pool } from "../../../database/connection";

export async function criarAnuncioService(usuarioId: number, data: any) {
  const {
    produto_id,
    marketplace,
    codigo_anuncio,
    titulo,
    descricao,
    tipo_anuncio,
    preco_venda,
    estoque_anuncio,
    url
  } = data;

  const produto = await pool.query(
    "SELECT id FROM produtos WHERE id = $1 AND usuario_id = $2 AND ativo = TRUE",
    [produto_id, usuarioId]
  );

  if (produto.rows.length === 0) {
    throw new Error("Produto não encontrado para este usuário");
  }

  const resultado = await pool.query(
    `
    INSERT INTO anuncios
    (usuario_id, produto_id, marketplace, codigo_anuncio, titulo, descricao, tipo_anuncio, preco_venda, estoque_anuncio, url)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
    `,
    [
      usuarioId,
      produto_id,
      marketplace,
      codigo_anuncio,
      titulo,
      descricao,
      tipo_anuncio,
      preco_venda,
      estoque_anuncio,
      url
    ]
  );

  return resultado.rows[0];
}

export async function listarAnunciosService(usuarioId: number) {
  const resultado = await pool.query(
    `
    SELECT 
      a.*,
      p.sku,
      p.nome AS produto_nome,
      p.estoque_atual,
      p.preco_entrada,
      (a.preco_venda - p.preco_entrada) AS lucro_estimado
    FROM anuncios a
    JOIN produtos p ON p.id = a.produto_id
    WHERE a.usuario_id = $1
    AND a.status <> 'desativado'
    ORDER BY a.id DESC
    `,
    [usuarioId]
  );

  return resultado.rows;
}

export async function atualizarAnuncioService(
  usuarioId: number,
  anuncioId: number,
  data: any
) {
  const {
    produto_id,
    marketplace,
    codigo_anuncio,
    titulo,
    descricao,
    tipo_anuncio,
    preco_venda,
    estoque_anuncio,
    url,
    status
  } = data;

  const resultado = await pool.query(
    `
    UPDATE anuncios
    SET
      produto_id = $1,
      marketplace = $2,
      codigo_anuncio = $3,
      titulo = $4,
      descricao = $5,
      tipo_anuncio = $6,
      preco_venda = $7,
      estoque_anuncio = $8,
      url = $9,
      status = $10,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE id = $11
    AND usuario_id = $12
    RETURNING *
    `,
    [
      produto_id,
      marketplace,
      codigo_anuncio,
      titulo,
      descricao,
      tipo_anuncio,
      preco_venda,
      estoque_anuncio,
      url,
      status,
      anuncioId,
      usuarioId
    ]
  );

  if (resultado.rows.length === 0) {
    throw new Error("Anúncio não encontrado");
  }

  return resultado.rows[0];
}

export async function desativarAnuncioService(
  usuarioId: number,
  anuncioId: number
) {
  const resultado = await pool.query(
    `
    UPDATE anuncios
    SET status = 'desativado',
        atualizado_em = CURRENT_TIMESTAMP
    WHERE id = $1
    AND usuario_id = $2
    RETURNING *
    `,
    [anuncioId, usuarioId]
  );

  if (resultado.rows.length === 0) {
    throw new Error("Anúncio não encontrado");
  }

  return resultado.rows[0];
}

export async function clonarAnuncioService(
  usuarioId: number,
  anuncioId: number,
  data: any
) {
  const anuncioOriginal = await pool.query(
    `
    SELECT *
    FROM anuncios
    WHERE id = $1
    AND usuario_id = $2
    `,
    [anuncioId, usuarioId]
  );

  if (anuncioOriginal.rows.length === 0) {
    throw new Error("Anúncio original não encontrado");
  }

  const original = anuncioOriginal.rows[0];

  const novoTitulo = data.titulo || `${original.titulo} - Cópia`;
  const novoPreco = data.preco_venda || original.preco_venda;
  const novoTipo = data.tipo_anuncio || original.tipo_anuncio;
  const novoEstoque = data.estoque_anuncio || original.estoque_anuncio;
  const novoProdutoId = data.produto_id || original.produto_id;

  const resultado = await pool.query(
    `
    INSERT INTO anuncios
    (usuario_id, produto_id, marketplace, codigo_anuncio, titulo, descricao, tipo_anuncio, preco_venda, estoque_anuncio, url, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'rascunho')
    RETURNING *
    `,
    [
      usuarioId,
      novoProdutoId,
      original.marketplace,
      null,
      novoTitulo,
      original.descricao,
      novoTipo,
      novoPreco,
      novoEstoque,
      null
    ]
  );

  return resultado.rows[0];
}