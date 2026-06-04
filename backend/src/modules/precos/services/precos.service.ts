import { pool } from "../../../database/connection";

function numero(valor: any): number {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function calcularNovoPreco(
  precoAtual: number,
  tipoReajuste: string,
  valorReajuste: number,
  operacao: string
) {
  if (tipoReajuste === "percentual") {
    const percentual = precoAtual * (valorReajuste / 100);
    return operacao === "reduzir"
      ? precoAtual - percentual
      : precoAtual + percentual;
  }

  return operacao === "reduzir"
    ? precoAtual - valorReajuste
    : precoAtual + valorReajuste;
}

async function obterConfiguracao(usuarioId: number) {
  const resultado = await pool.query(
    `
    SELECT *
    FROM configuracoes_usuario
    WHERE usuario_id = $1
    `,
    [usuarioId]
  );

  return resultado.rows[0] || {};
}

async function recalcularLucroAnuncio(
  usuarioId: number,
  anuncioId: number,
  novoPreco: number
) {
  const anuncioResult = await pool.query(
    `
    SELECT
      a.*,
      p.custo_medio,
      p.preco_entrada,
      p.tipo_produto
    FROM anuncios a
    LEFT JOIN produtos p ON p.id = a.produto_id
    WHERE a.id = $1
    AND a.usuario_id = $2
    `,
    [anuncioId, usuarioId]
  );

  if (anuncioResult.rows.length === 0) {
    throw new Error("Anúncio não encontrado");
  }

  const anuncio = anuncioResult.rows[0];
  const config = await obterConfiguracao(usuarioId);

  const imposto = novoPreco * (numero(config.percentual_imposto) / 100);
  const embalagem = numero(config.custo_embalagem_padrao);
  const outrosGastos = numero(config.outros_gastos_padrao);
  const taxa = numero(anuncio.taxa_marketplace_prevista);
  const frete = numero(anuncio.frete_previsto);

  let custoProduto = numero(anuncio.custo_medio || anuncio.preco_entrada);

  if (anuncio.tipo_produto === "kit" && anuncio.produto_id) {
    const componentes = await pool.query(
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
      [anuncio.produto_id, usuarioId]
    );

    custoProduto = componentes.rows.reduce((soma, item) => {
      return (
        soma +
        numero(item.quantidade) *
          numero(item.custo_medio || item.preco_entrada)
      );
    }, 0);
  }

  const lucro =
    novoPreco -
    taxa -
    frete -
    imposto -
    embalagem -
    outrosGastos -
    custoProduto;

  const margem = novoPreco > 0 ? (lucro / novoPreco) * 100 : 0;

  return {
    imposto,
    embalagem,
    outrosGastos,
    custoProduto,
    lucro,
    margem
  };
}

export async function listarAnunciosPrecosService(
  usuarioId: number,
  contaMercadoLivreId?: number | null
) {
  let query = `
    SELECT
      a.id,
      a.codigo_anuncio,
      a.titulo,
      a.marketplace,
      a.preco_venda,
      a.preco_sincronizado,
      a.lucro_estimado,
      a.margem_estimada,
      a.estoque_anuncio,
      a.status,
      a.sku_marketplace,
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
    query += ` AND a.conta_mercado_livre_id = $2`;
    params.push(contaMercadoLivreId);
  }

  query += ` ORDER BY a.id DESC`;

  const resultado = await pool.query(query, params);
  return resultado.rows;
}

export async function reajustarPrecosService(
  usuarioId: number,
  data: any,
  contaMercadoLivreId?: number | null
) {
  const {
    anuncio_ids,
    tipo_reajuste,
    valor_reajuste,
    operacao,
    enviar_para_fila
  } = data;

  const tipo = tipo_reajuste || "percentual";
  const valor = numero(valor_reajuste);
  const op = operacao || "aumentar";

  if (valor <= 0) {
    throw new Error("Valor de reajuste precisa ser maior que zero");
  }

  let query = `
    SELECT *
    FROM anuncios
    WHERE usuario_id = $1
    AND status <> 'desativado'
  `;

  const params: any[] = [usuarioId];

  if (Array.isArray(anuncio_ids) && anuncio_ids.length > 0) {
    query += ` AND id = ANY($2)`;
    params.push(anuncio_ids);
  } else if (contaMercadoLivreId) {
    query += ` AND conta_mercado_livre_id = $2`;
    params.push(contaMercadoLivreId);
  }

  const anunciosResult = await pool.query(query, params);

  let atualizados = 0;
  let enfileirados = 0;

  await pool.query("BEGIN");

  try {
    for (const anuncio of anunciosResult.rows) {
      const precoAnterior = numero(anuncio.preco_venda);
      const precoNovo = calcularNovoPreco(precoAnterior, tipo, valor, op);

      if (precoNovo <= 0) {
        continue;
      }

      const calculo = await recalcularLucroAnuncio(
        usuarioId,
        anuncio.id,
        precoNovo
      );

      await pool.query(
        `
        UPDATE anuncios
        SET
          preco_venda = $1,
          imposto_previsto = $2,
          embalagem_prevista = $3,
          outros_gastos_previstos = $4,
          custo_produto_previsto = $5,
          lucro_estimado = $6,
          margem_estimada = $7,
          sincronizado = FALSE,
          atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $8
        AND usuario_id = $9
        `,
        [
          precoNovo,
          calculo.imposto,
          calculo.embalagem,
          calculo.outrosGastos,
          calculo.custoProduto,
          calculo.lucro,
          calculo.margem,
          anuncio.id,
          usuarioId
        ]
      );

      await pool.query(
        `
        INSERT INTO historico_precos
        (
          usuario_id,
          anuncio_id,
          preco_anterior,
          preco_novo,
          tipo_reajuste,
          valor_reajuste
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          usuarioId,
          anuncio.id,
          precoAnterior,
          precoNovo,
          tipo,
          valor
        ]
      );

      atualizados++;

      if (enviar_para_fila && anuncio.conta_mercado_livre_id) {
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
          VALUES ($1,$2,$3,'mercado_livre','preco',$4)
          `,
          [
            usuarioId,
            anuncio.id,
            anuncio.conta_mercado_livre_id,
            JSON.stringify({
              anuncio_id: anuncio.id,
              codigo_anuncio: anuncio.codigo_anuncio,
              preco: precoNovo
            })
          ]
        );

        enfileirados++;
      }
    }

    await pool.query("COMMIT");

    return {
      mensagem: "Reajuste concluído",
      analisados: anunciosResult.rows.length,
      atualizados,
      enfileirados
    };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}