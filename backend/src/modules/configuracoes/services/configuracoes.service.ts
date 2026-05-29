import { pool } from "../../../database/connection";

export async function obterConfiguracoesService(usuarioId: number) {
  const resultado = await pool.query(
    `
    SELECT *
    FROM configuracoes_usuario
    WHERE usuario_id = $1
    `,
    [usuarioId]
  );

  if (resultado.rows.length === 0) {
    const novaConfig = await pool.query(
      `
      INSERT INTO configuracoes_usuario
      (
        usuario_id,
        percentual_imposto,
        custo_embalagem_padrao,
        outros_gastos_padrao,
        marketplace_padrao,
        sincronizar_estoque_multiconta
      )
      VALUES ($1,0,0,0,'mercado_livre',FALSE)
      RETURNING *
      `,
      [usuarioId]
    );

    return novaConfig.rows[0];
  }

  return resultado.rows[0];
}

export async function atualizarConfiguracoesService(usuarioId: number, data: any) {
  const {
    percentual_imposto,
    custo_embalagem_padrao,
    outros_gastos_padrao,
    marketplace_padrao,
    sincronizar_estoque_multiconta
  } = data;

  const configuracaoAtual = await obterConfiguracoesService(usuarioId);

  const resultado = await pool.query(
    `
    UPDATE configuracoes_usuario
    SET
      percentual_imposto = $1,
      custo_embalagem_padrao = $2,
      outros_gastos_padrao = $3,
      marketplace_padrao = $4,
      sincronizar_estoque_multiconta = $5,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE id = $6
    AND usuario_id = $7
    RETURNING *
    `,
    [
      percentual_imposto ?? configuracaoAtual.percentual_imposto,
      custo_embalagem_padrao ?? configuracaoAtual.custo_embalagem_padrao,
      outros_gastos_padrao ?? configuracaoAtual.outros_gastos_padrao,
      marketplace_padrao ?? configuracaoAtual.marketplace_padrao,
      sincronizar_estoque_multiconta ??
        configuracaoAtual.sincronizar_estoque_multiconta,
      configuracaoAtual.id,
      usuarioId
    ]
  );

  return resultado.rows[0];
}