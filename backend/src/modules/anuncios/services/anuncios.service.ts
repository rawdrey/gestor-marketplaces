import { pool } from "../../../database/connection";

function calcularMargem(lucro: number, precoVenda: number) {
  if (precoVenda <= 0) return 0;
  return (lucro / precoVenda) * 100;
}

async function buscarConfiguracaoUsuario(usuarioId: number) {
  const result = await pool.query(
    `
    SELECT *
    FROM configuracoes_usuario
    WHERE usuario_id = $1
    `,
    [usuarioId]
  );

  return result.rows[0] || {};
}

async function calcularCustosPrevistos(
  usuarioId: number,
  produtoId: number,
  precoVenda: number,
  taxaMarketplacePrevista: number,
  fretePrevisto: number,
  outrosGastosPrevistosInformado?: number
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
    throw new Error("Produto não encontrado para este usuário");
  }

  const produto = produtoResult.rows[0];
  const config = await buscarConfiguracaoUsuario(usuarioId);

  const percentualImposto = Number(config.percentual_imposto || 0);
  const embalagemPrevista = Number(config.custo_embalagem_padrao || 0);
  const outrosGastosPrevistos = Number(
    outrosGastosPrevistosInformado ?? config.outros_gastos_padrao ?? 0
  );

  const impostoPrevisto = Number(precoVenda) * (percentualImposto / 100);

  let custoProdutoPrevisto = 0;

  if (produto.tipo_produto === "kit") {
    const componentesResult = await pool.query(
      `
      SELECT
        pc.quantidade,
        p.custo_medio,
        p.preco_entrada
      FROM produto_componentes pc
      JOIN produtos p ON p.id = pc.produto_componente_id
      WHERE pc.produto_kit_id = $1
      AND pc.usuario_id = $2
      `,
      [produtoId, usuarioId]
    );

    for (const item of componentesResult.rows) {
      const custoUnitario = Number(item.custo_medio || item.preco_entrada || 0);
      custoProdutoPrevisto += custoUnitario * Number(item.quantidade);
    }
  } else {
    custoProdutoPrevisto = Number(
      produto.custo_medio || produto.preco_entrada || 0
    );
  }

  const lucroEstimado =
    Number(precoVenda) -
    Number(taxaMarketplacePrevista || 0) -
    Number(fretePrevisto || 0) -
    Number(impostoPrevisto || 0) -
    Number(embalagemPrevista || 0) -
    Number(outrosGastosPrevistos || 0) -
    Number(custoProdutoPrevisto || 0);

  const margemEstimada = calcularMargem(lucroEstimado, Number(precoVenda));

  return {
    produto,
    impostoPrevisto,
    embalagemPrevista,
    outrosGastosPrevistos,
    custoProdutoPrevisto,
    lucroEstimado,
    margemEstimada
  };
}

export async function criarAnuncioService(
  usuarioId: number,
  data: any,
  contaMercadoLivreId?: number | null
) {
  const {
    produto_id,
    marketplace,
    codigo_anuncio,
    sku_marketplace,
    titulo,
    descricao,
    tipo_anuncio,
    preco_venda,
    estoque_anuncio,
    taxa_marketplace_prevista,
    frete_previsto,
    outros_gastos_previstos,
    url,
    dados_api
  } = data;

  const custos = await calcularCustosPrevistos(
    usuarioId,
    produto_id,
    Number(preco_venda),
    Number(taxa_marketplace_prevista || 0),
    Number(frete_previsto || 0),
    outros_gastos_previstos
  );

  const resultado = await pool.query(
    `
    INSERT INTO anuncios
    (
      usuario_id,
      conta_mercado_livre_id,
      produto_id,
      marketplace,
      codigo_anuncio,
      sku_marketplace,
      titulo,
      descricao,
      tipo_anuncio,
      preco_venda,
      estoque_anuncio,
      taxa_marketplace_prevista,
      frete_previsto,
      imposto_previsto,
      embalagem_prevista,
      outros_gastos_previstos,
      custo_produto_previsto,
      lucro_estimado,
      margem_estimada,
      url,
      status,
      dados_api
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,'ativo',$21)
    RETURNING *
    `,
    [
      usuarioId,
      contaMercadoLivreId || null,
      produto_id,
      marketplace,
      codigo_anuncio || null,
      sku_marketplace || custos.produto.sku,
      titulo,
      descricao,
      tipo_anuncio,
      preco_venda,
      estoque_anuncio,
      taxa_marketplace_prevista || 0,
      frete_previsto || 0,
      custos.impostoPrevisto,
      custos.embalagemPrevista,
      custos.outrosGastosPrevistos,
      custos.custoProdutoPrevisto,
      custos.lucroEstimado,
      custos.margemEstimada,
      url || null,
      dados_api || null
    ]
  );

  return resultado.rows[0];
}

export async function listarAnunciosService(
  usuarioId: number,
  contaMercadoLivreId?: number | null
) {
  let query = `
    SELECT 
      a.*,
      c.nickname AS conta_nickname,
      c.nome_conta,
      p.sku AS sku_interno,
      p.nome AS produto_nome,
      p.tipo_produto,
      p.estoque_atual,
      p.custo_medio,
      p.preco_entrada
FROM anuncios a
LEFT JOIN produtos p ON p.id = a.produto_id
LEFT JOIN contas_mercado_livre c ON c.id = a.conta_mercado_livre_id    
    WHERE a.usuario_id = $1
    AND a.status <> 'desativado'
  `;

  const params: any[] = [usuarioId];

  if (contaMercadoLivreId) {
    query += ` AND a.conta_mercado_livre_id = $2`;
    params.push(contaMercadoLivreId);
  }

  query += ` ORDER BY a.id DESC`;

  const resultado = await pool.query(query, params);

  return resultado.rows;
}

export async function atualizarAnuncioService(
  usuarioId: number,
  anuncioId: number,
  data: any
) {
  const anuncioAtualResult = await pool.query(
    `
    SELECT *
    FROM anuncios
    WHERE id = $1
    AND usuario_id = $2
    `,
    [anuncioId, usuarioId]
  );

  if (anuncioAtualResult.rows.length === 0) {
    throw new Error("Anúncio não encontrado");
  }

  const atual = anuncioAtualResult.rows[0];

  const produtoId = data.produto_id || atual.produto_id;
  const precoVenda = Number(data.preco_venda ?? atual.preco_venda);
  const taxaPrevista = Number(
    data.taxa_marketplace_prevista ?? atual.taxa_marketplace_prevista ?? 0
  );
  const fretePrevisto = Number(data.frete_previsto ?? atual.frete_previsto ?? 0);

  const custos = await calcularCustosPrevistos(
    usuarioId,
    produtoId,
    precoVenda,
    taxaPrevista,
    fretePrevisto,
    data.outros_gastos_previstos ?? atual.outros_gastos_previstos
  );

  const resultado = await pool.query(
    `
    UPDATE anuncios
    SET
      produto_id = $1,
      marketplace = $2,
      codigo_anuncio = $3,
      sku_marketplace = $4,
      titulo = $5,
      descricao = $6,
      tipo_anuncio = $7,
      preco_venda = $8,
      estoque_anuncio = $9,
      taxa_marketplace_prevista = $10,
      frete_previsto = $11,
      imposto_previsto = $12,
      embalagem_prevista = $13,
      outros_gastos_previstos = $14,
      custo_produto_previsto = $15,
      lucro_estimado = $16,
      margem_estimada = $17,
      url = $18,
      status = $19,
      dados_api = $20,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE id = $21
    AND usuario_id = $22
    RETURNING *
    `,
    [
      produtoId,
      data.marketplace ?? atual.marketplace,
      data.codigo_anuncio ?? atual.codigo_anuncio,
      data.sku_marketplace ?? atual.sku_marketplace,
      data.titulo ?? atual.titulo,
      data.descricao ?? atual.descricao,
      data.tipo_anuncio ?? atual.tipo_anuncio,
      precoVenda,
      data.estoque_anuncio ?? atual.estoque_anuncio,
      taxaPrevista,
      fretePrevisto,
      custos.impostoPrevisto,
      custos.embalagemPrevista,
      custos.outrosGastosPrevistos,
      custos.custoProdutoPrevisto,
      custos.lucroEstimado,
      custos.margemEstimada,
      data.url ?? atual.url,
      data.status ?? atual.status,
      data.dados_api ?? atual.dados_api,
      anuncioId,
      usuarioId
    ]
  );

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
  data: any,
  contaMercadoLivreId?: number | null
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

  const novoProdutoId = data.produto_id || original.produto_id;
  const novoPreco = Number(data.preco_venda ?? original.preco_venda);
  const novaTaxa = Number(
    data.taxa_marketplace_prevista ?? original.taxa_marketplace_prevista ?? 0
  );
  const novoFrete = Number(data.frete_previsto ?? original.frete_previsto ?? 0);

  const custos = await calcularCustosPrevistos(
    usuarioId,
    novoProdutoId,
    novoPreco,
    novaTaxa,
    novoFrete,
    data.outros_gastos_previstos ?? original.outros_gastos_previstos
  );

  const resultado = await pool.query(
    `
    INSERT INTO anuncios
    (
      usuario_id,
      conta_mercado_livre_id,
      produto_id,
      marketplace,
      codigo_anuncio,
      sku_marketplace,
      titulo,
      descricao,
      tipo_anuncio,
      preco_venda,
      estoque_anuncio,
      taxa_marketplace_prevista,
      frete_previsto,
      imposto_previsto,
      embalagem_prevista,
      outros_gastos_previstos,
      custo_produto_previsto,
      lucro_estimado,
      margem_estimada,
      url,
      status,
      sincronizado,
      dados_api
    )
    VALUES
    ($1,$2,$3,$4,NULL,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NULL,'rascunho',FALSE,$19)
    RETURNING *
    `,
    [
      usuarioId,
      data.conta_mercado_livre_id ||
        contaMercadoLivreId ||
        original.conta_mercado_livre_id ||
        null,
      novoProdutoId,
      data.marketplace ?? original.marketplace,
      data.sku_marketplace ?? original.sku_marketplace,
      data.titulo || `${original.titulo} - Cópia`,
      data.descricao ?? original.descricao,
      data.tipo_anuncio ?? original.tipo_anuncio,
      novoPreco,
      data.estoque_anuncio ?? original.estoque_anuncio,
      novaTaxa,
      novoFrete,
      custos.impostoPrevisto,
      custos.embalagemPrevista,
      custos.outrosGastosPrevistos,
      custos.custoProdutoPrevisto,
      custos.lucroEstimado,
      custos.margemEstimada,
      data.dados_api ?? original.dados_api
    ]
  );

  return resultado.rows[0];
}

function extrairCodigoAnuncio(texto: string) {
  const encontrado = texto.match(/MLB\d+/i);

  if (encontrado) {
    return encontrado[0].toUpperCase();
  }

  return texto.trim().toUpperCase();
}

export async function buscarAnuncioParaClonarService(
  usuarioId: number,
  termo: string,
  contaMercadoLivreId?: number | null
) {
  const codigo = extrairCodigoAnuncio(termo);

  let query = `
    SELECT
      a.*,
      p.sku AS sku_interno,
      p.nome AS produto_nome,
      c.nickname AS conta_nickname,
      c.nome_conta
FROM anuncios a
LEFT JOIN produtos p ON p.id = a.produto_id
LEFT JOIN contas_mercado_livre c ON c.id = a.conta_mercado_livre_id    
    WHERE a.usuario_id = $1
    AND (
      UPPER(a.codigo_anuncio) = $2
      OR UPPER(a.sku_marketplace) = $2
    )
    AND a.status <> 'desativado'
  `;

  const params: any[] = [usuarioId, codigo];

  if (contaMercadoLivreId) {
    query += ` AND a.conta_mercado_livre_id = $3`;
    params.push(contaMercadoLivreId);
  }

  query += ` LIMIT 1`;

  const resultado = await pool.query(query, params);

  if (resultado.rows.length === 0) {
    throw new Error("Anúncio não encontrado");
  }

  return resultado.rows[0];
}

export async function vincularSkuAnuncioService(
  usuarioId: number,
  anuncioId: number,
  sku: string
) {
  const produtoResult = await pool.query(
    `
    SELECT id
    FROM produtos
    WHERE usuario_id = $1
    AND sku = $2
    AND ativo = TRUE
    `,
    [usuarioId, sku]
  );

  if (produtoResult.rows.length === 0) {
    throw new Error("SKU não encontrado");
  }

  const produtoId = produtoResult.rows[0].id;

  const resultado = await pool.query(
    `
    UPDATE anuncios
    SET
      produto_id = $1,
      sku_marketplace = $2,
      vinculo_sku_status = 'vinculado',
      atualizado_em = CURRENT_TIMESTAMP
    WHERE id = $3
    AND usuario_id = $4
    RETURNING *
    `,
    [produtoId, sku, anuncioId, usuarioId]
  );

  if (resultado.rows.length === 0) {
    throw new Error("Anúncio não encontrado");
  }

  return resultado.rows[0];
}