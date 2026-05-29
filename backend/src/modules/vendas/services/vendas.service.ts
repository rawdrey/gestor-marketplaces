import { pool } from "../../../database/connection";
import { sincronizarEstoqueProduto } from "../../sincronizacao/services/sincronizacao.service";

function numero(valor: any): number {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function calcularMargem(lucro: number, valorBruto: number): number {
  if (valorBruto <= 0) return 0;
  return (lucro / valorBruto) * 100;
}

export async function registrarVendaService(usuarioId: number, data: any) {
  const {
    produto_id,
    anuncio_id,
    marketplace,
    codigo_venda,
    quantidade,
    valor_bruto,
    taxa_marketplace,
    frete_pago_cliente,
    frete_descontado,
    outros_gastos
  } = data;

  const quantidadeVenda = numero(quantidade);

  if (quantidadeVenda <= 0) {
    throw new Error("A quantidade da venda precisa ser maior que zero");
  }

  const produtoResult = await pool.query(
    `
    SELECT *
    FROM produtos
    WHERE id = $1
    AND usuario_id = $2
    AND ativo = TRUE
    `,
    [produto_id, usuarioId]
  );

  if (produtoResult.rows.length === 0) {
    throw new Error("Produto não encontrado");
  }

  const produto = produtoResult.rows[0];

  const configResult = await pool.query(
    `
    SELECT *
    FROM configuracoes_usuario
    WHERE usuario_id = $1
    `,
    [usuarioId]
  );

  const config = configResult.rows[0] || {};

  const percentualImposto = numero(config.percentual_imposto);
  const embalagemPadrao = numero(config.custo_embalagem_padrao);
  const outrosGastosPadrao = numero(config.outros_gastos_padrao);

  const valorBruto = numero(valor_bruto);
  const taxaMarketplace = numero(taxa_marketplace);
  const fretePagoCliente = numero(frete_pago_cliente);
  const freteDescontado = numero(frete_descontado);
  const embalagem = embalagemPadrao;

  const outrosGastosFinal =
    outros_gastos !== undefined && outros_gastos !== null
      ? numero(outros_gastos)
      : outrosGastosPadrao;

  const imposto = valorBruto * (percentualImposto / 100);

  const custoProduto = await calcularCustoProdutoVenda(
    usuarioId,
    produto_id,
    produto.tipo_produto,
    quantidadeVenda
  );

  const valorLiquido = valorBruto - taxaMarketplace - freteDescontado;

  const lucro =
    valorBruto -
    taxaMarketplace -
    freteDescontado -
    imposto -
    embalagem -
    outrosGastosFinal -
    custoProduto;

  const margemLucro = calcularMargem(lucro, valorBruto);

  await pool.query("BEGIN");

  try {
    const vendaResult = await pool.query(
      `
      INSERT INTO vendas
      (
        usuario_id,
        produto_id,
        anuncio_id,
        marketplace,
        codigo_venda,
        quantidade,
        valor_venda,
        valor_bruto,
        valor_liquido,
        taxa_marketplace,
        frete_pago_cliente,
        frete_descontado,
        frete,
        imposto,
        embalagem,
        outros_gastos,
        custo_produto,
        lucro,
        margem_lucro
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *
      `,
      [
        usuarioId,
        produto_id,
        anuncio_id || null,
        marketplace,
        codigo_venda,
        quantidadeVenda,
        valorBruto,
        valorBruto,
        valorLiquido,
        taxaMarketplace,
        fretePagoCliente,
        freteDescontado,
        freteDescontado,
        imposto,
        embalagem,
        outrosGastosFinal,
        custoProduto,
        lucro,
        margemLucro
      ]
    );

    const venda = vendaResult.rows[0];

    if (produto.tipo_produto === "kit") {
  const componentesBaixados = await baixarEstoqueKit(
    usuarioId,
    produto_id,
    quantidadeVenda,
    venda.id
  );

  for (const componente of componentesBaixados) {
    await sincronizarEstoqueProduto(
      usuarioId,
      componente.produto_id,
      data.conta_mercado_livre_id || null
    );
  }
} else {
  await baixarEstoqueProdutoSimples(
    usuarioId,
    produto_id,
    quantidadeVenda,
    venda.id
  );

  await sincronizarEstoqueProduto(
    usuarioId,
    produto_id,
    data.conta_mercado_livre_id || null
  );
}

await pool.query("COMMIT");

return venda;
    await pool.query("COMMIT");

    return venda;
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function calcularCustoProdutoVenda(
  usuarioId: number,
  produtoId: number,
  tipoProduto: string,
  quantidadeVenda: number
): Promise<number> {
  if (tipoProduto === "kit") {
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
      AND p.ativo = TRUE
      `,
      [produtoId, usuarioId]
    );

    if (componentesResult.rows.length === 0) {
      throw new Error("Kit sem componentes cadastrados");
    }

    let custoKitUnitario = 0;

    for (const item of componentesResult.rows) {
      const custoUnitarioComponente = numero(
        item.custo_medio || item.preco_entrada
      );

      const quantidadeComponente = numero(item.quantidade);

      custoKitUnitario += custoUnitarioComponente * quantidadeComponente;
    }

    return custoKitUnitario * quantidadeVenda;
  }

  const produtoResult = await pool.query(
    `
    SELECT custo_medio, preco_entrada
    FROM produtos
    WHERE id = $1
    AND usuario_id = $2
    AND ativo = TRUE
    `,
    [produtoId, usuarioId]
  );

  if (produtoResult.rows.length === 0) {
    throw new Error("Produto não encontrado para cálculo de custo");
  }

  const produto = produtoResult.rows[0];
  const custoUnitario = numero(produto.custo_medio || produto.preco_entrada);

  return custoUnitario * quantidadeVenda;
}

async function baixarEstoqueProdutoSimples(
  usuarioId: number,
  produtoId: number,
  quantidade: number,
  vendaId: number
) {
  const produtoResult = await pool.query(
    `
    SELECT estoque_atual
    FROM produtos
    WHERE id = $1
    AND usuario_id = $2
    FOR UPDATE
    `,
    [produtoId, usuarioId]
  );

  if (produtoResult.rows.length === 0) {
    throw new Error("Produto não encontrado para baixa de estoque");
  }

  const estoqueAtual = numero(produtoResult.rows[0].estoque_atual);

  if (estoqueAtual < quantidade) {
    throw new Error("Estoque insuficiente");
  }

  const estoqueNovo = estoqueAtual - quantidade;

  await pool.query(
    `
    UPDATE produtos
    SET estoque_atual = $1,
        atualizado_em = CURRENT_TIMESTAMP
    WHERE id = $2
    AND usuario_id = $3
    `,
    [estoqueNovo, produtoId, usuarioId]
  );

  await pool.query(
    `
    INSERT INTO movimentacoes_estoque
    (
      usuario_id,
      produto_id,
      venda_id,
      tipo,
      quantidade,
      estoque_anterior,
      estoque_novo,
      observacao
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `,
    [
      usuarioId,
      produtoId,
      vendaId,
      "saida_venda",
      quantidade,
      estoqueAtual,
      estoqueNovo,
      "Baixa automática por venda"
    ]
  );
}

async function baixarEstoqueKit(
  usuarioId: number,
  produtoKitId: number,
  quantidadeVendida: number,
  vendaId: number
): Promise<Array<{ produto_id: number }>> {
  const componentesResult = await pool.query(
    `
    SELECT
      pc.produto_componente_id,
      pc.quantidade,
      p.estoque_atual,
      p.nome
    FROM produto_componentes pc
    JOIN produtos p ON p.id = pc.produto_componente_id
    WHERE pc.produto_kit_id = $1
    AND pc.usuario_id = $2
    AND p.ativo = TRUE
    FOR UPDATE
    `,
    [produtoKitId, usuarioId]
  );

  if (componentesResult.rows.length === 0) {
    throw new Error("Kit sem componentes cadastrados");
  }

  for (const item of componentesResult.rows) {
    const quantidadeNecessaria =
      numero(item.quantidade) * numero(quantidadeVendida);

    if (numero(item.estoque_atual) < quantidadeNecessaria) {
      throw new Error(`Estoque insuficiente para o componente: ${item.nome}`);
    }
  }

  const componentesBaixados: Array<{ produto_id: number }> = [];

  for (const item of componentesResult.rows) {
    const componenteId = numero(item.produto_componente_id);
    const estoqueAnterior = numero(item.estoque_atual);
    const quantidadeNecessaria =
      numero(item.quantidade) * numero(quantidadeVendida);
    const estoqueNovo = estoqueAnterior - quantidadeNecessaria;

    await pool.query(
      `
      UPDATE produtos
      SET estoque_atual = $1,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $2
      AND usuario_id = $3
      `,
      [estoqueNovo, componenteId, usuarioId]
    );

    await pool.query(
      `
      INSERT INTO movimentacoes_estoque
      (
        usuario_id,
        produto_id,
        venda_id,
        tipo,
        quantidade,
        estoque_anterior,
        estoque_novo,
        observacao
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        usuarioId,
        componenteId,
        vendaId,
        "kit_componente",
        quantidadeNecessaria,
        estoqueAnterior,
        estoqueNovo,
        "Baixa automática de componente de kit"
      ]
    );

    componentesBaixados.push({
      produto_id: componenteId
    });
  }

  return componentesBaixados;
}

export async function listarVendasService(usuarioId: number) {
  const resultado = await pool.query(
    `
    SELECT
      v.*,
      p.sku,
      p.nome AS produto_nome,
      p.tipo_produto,
      a.titulo AS anuncio_titulo
    FROM vendas v
    JOIN produtos p ON p.id = v.produto_id
    LEFT JOIN anuncios a ON a.id = v.anuncio_id
    WHERE v.usuario_id = $1
    ORDER BY v.id DESC
    `,
    [usuarioId]
  );

  return resultado.rows;
}