import { pool } from "../../../database/connection";
import { sincronizarEstoqueProduto } from "../../sincronizacao/services/sincronizacao.service";

function numero(valor: any): number {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

export async function registrarEntradaEstoqueService(usuarioId: number, data: any) {
  const { sku, quantidade, custo_unitario, observacao } = data;

  const quantidadeEntrada = numero(quantidade);
  const custoUnitarioEntrada = numero(custo_unitario);

  if (!sku) {
    throw new Error("SKU é obrigatório");
  }

  if (quantidadeEntrada <= 0) {
    throw new Error("Quantidade precisa ser maior que zero");
  }

  if (custoUnitarioEntrada < 0) {
    throw new Error("Custo unitário não pode ser negativo");
  }

  await pool.query("BEGIN");

  try {
    const produtoResult = await pool.query(
      `
      SELECT *
      FROM produtos
      WHERE sku = $1
      AND usuario_id = $2
      AND ativo = TRUE
      FOR UPDATE
      `,
      [sku, usuarioId]
    );

    if (produtoResult.rows.length === 0) {
      throw new Error("Produto não encontrado para este SKU");
    }

    const produto = produtoResult.rows[0];

    if (produto.tipo_produto === "kit") {
      throw new Error("Entrada de estoque deve ser feita nos componentes, não no kit");
    }

    const estoqueAnterior = numero(produto.estoque_atual);
    const custoMedioAnterior = numero(produto.custo_medio || produto.preco_entrada);

    const custoTotalAnterior = estoqueAnterior * custoMedioAnterior;
    const custoTotalEntrada = quantidadeEntrada * custoUnitarioEntrada;

    const estoqueNovo = estoqueAnterior + quantidadeEntrada;

    const custoMedioNovo =
      estoqueNovo > 0
        ? (custoTotalAnterior + custoTotalEntrada) / estoqueNovo
        : custoUnitarioEntrada;

    const entradaResult = await pool.query(
      `
      INSERT INTO entradas_estoque
      (
        usuario_id,
        produto_id,
        sku,
        quantidade,
        custo_unitario,
        custo_total,
        estoque_anterior,
        estoque_novo,
        custo_medio_anterior,
        custo_medio_novo,
        observacao
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        usuarioId,
        produto.id,
        produto.sku,
        quantidadeEntrada,
        custoUnitarioEntrada,
        custoTotalEntrada,
        estoqueAnterior,
        estoqueNovo,
        custoMedioAnterior,
        custoMedioNovo,
        observacao || null
      ]
    );

    await pool.query(
      `
      UPDATE produtos
      SET
        estoque_atual = $1,
        custo_medio = $2,
        preco_entrada = $3,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $4
      AND usuario_id = $5
      `,
      [
        estoqueNovo,
        custoMedioNovo,
        custoUnitarioEntrada,
        produto.id,
        usuarioId
      ]
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
      VALUES ($1,$2,NULL,$3,$4,$5,$6,$7)
      `,
      [
        usuarioId,
        produto.id,
        "entrada",
        quantidadeEntrada,
        estoqueAnterior,
        estoqueNovo,
        observacao || "Entrada de estoque"
      ]
    );

    await sincronizarEstoqueProduto(usuarioId, produto.id);

    await pool.query("COMMIT");

    return entradaResult.rows[0];
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function listarEntradasEstoqueService(usuarioId: number) {
  const resultado = await pool.query(
    `
    SELECT
      e.*,
      p.nome AS produto_nome
    FROM entradas_estoque e
    JOIN produtos p ON p.id = e.produto_id
    WHERE e.usuario_id = $1
    ORDER BY e.id DESC
    `,
    [usuarioId]
  );

  return resultado.rows;
}