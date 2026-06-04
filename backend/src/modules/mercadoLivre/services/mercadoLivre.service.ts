import axios from "axios";
import { pool } from "../../../database/connection";
import crypto from "crypto";

export async function gerarUrlAutorizacaoService(usuarioId: number) {
  const clientId = process.env.ML_CLIENT_ID;
  const redirectUri = process.env.ML_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Credenciais do Mercado Livre não configuradas");
  }

  const state = crypto.randomBytes(32).toString("hex");

  await pool.query(
    `
    INSERT INTO oauth_states (usuario_id, state)
    VALUES ($1, $2)
    `,
    [usuarioId, state]
  );

  return `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${state}`;
}

export async function validarStateOAuthService(state: string) {
  const resultado = await pool.query(
    `
    SELECT *
    FROM oauth_states
    WHERE state = $1
    AND usado = FALSE
    AND criado_em >= NOW() - INTERVAL '15 minutes'
    `,
    [state]
  );

  if (resultado.rows.length === 0) {
    throw new Error("State OAuth inválido ou expirado");
  }

  await pool.query(
    `
    UPDATE oauth_states
    SET usado = TRUE
    WHERE state = $1
    `,
    [state]
  );

  return resultado.rows[0].usuario_id;
}

export async function salvarContaMercadoLivreService(
  usuarioId: number,
  code: string
) {
  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  const redirectUri = process.env.ML_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Credenciais do Mercado Livre não configuradas");
  }

  const tokenResponse = await axios.post(
    "https://api.mercadolibre.com/oauth/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  const { access_token, refresh_token, expires_in, user_id } =
    tokenResponse.data;

  const userResponse = await axios.get(
    `https://api.mercadolibre.com/users/${user_id}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }
  );

  const nickname = userResponse.data.nickname;

  const resultado = await pool.query(
    `
    INSERT INTO contas_mercado_livre
    (
      usuario_id,
      ml_user_id,
      nickname,
      nome_conta,
      access_token,
      refresh_token,
      expires_in,
      token_criado_em,
      ativo
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP,TRUE)
    ON CONFLICT (usuario_id, ml_user_id)
    DO UPDATE SET
      nickname = EXCLUDED.nickname,
      nome_conta = EXCLUDED.nome_conta,
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_in = EXCLUDED.expires_in,
      token_criado_em = CURRENT_TIMESTAMP,
      ativo = TRUE,
      atualizado_em = CURRENT_TIMESTAMP
    RETURNING *
    `,
    [
      usuarioId,
      String(user_id),
      nickname,
      nickname,
      access_token,
      refresh_token,
      expires_in
    ]
  );

  return resultado.rows[0];
}

export async function listarContasMercadoLivreService(usuarioId: number) {
  const resultado = await pool.query(
    `
    SELECT
      id,
      ml_user_id,
      nickname,
      nome_conta,
      ativo,
      conta_padrao,
      criado_em,
      atualizado_em
    FROM contas_mercado_livre
    WHERE usuario_id = $1
    ORDER BY conta_padrao DESC, id DESC
    `,
    [usuarioId]
  );

  return resultado.rows;
}

export async function definirContaPadraoService(
  usuarioId: number,
  contaId: number
) {
  await pool.query("BEGIN");

  try {
    await pool.query(
      `
      UPDATE contas_mercado_livre
      SET conta_padrao = FALSE
      WHERE usuario_id = $1
      `,
      [usuarioId]
    );

    const resultado = await pool.query(
      `
      UPDATE contas_mercado_livre
      SET conta_padrao = TRUE,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE usuario_id = $1
      AND id = $2
      RETURNING id, nickname, nome_conta, conta_padrao
      `,
      [usuarioId, contaId]
    );

    if (resultado.rows.length === 0) {
      throw new Error("Conta Mercado Livre não encontrada");
    }

    await pool.query("COMMIT");

    return resultado.rows[0];
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function desativarContaMercadoLivreService(
  usuarioId: number,
  contaId: number
) {
  const resultado = await pool.query(
    `
    UPDATE contas_mercado_livre
    SET ativo = FALSE,
        atualizado_em = CURRENT_TIMESTAMP
    WHERE usuario_id = $1
    AND id = $2
    RETURNING id, nickname, nome_conta, ativo
    `,
    [usuarioId, contaId]
  );

  if (resultado.rows.length === 0) {
    throw new Error("Conta Mercado Livre não encontrada");
  }

  return resultado.rows[0];
}

async function obterContaAtiva(usuarioId: number, contaId?: number | null) {
  let query = `
    SELECT *
    FROM contas_mercado_livre
    WHERE usuario_id = $1
    AND ativo = TRUE
  `;

  const params: any[] = [usuarioId];

  if (contaId) {
    query += ` AND id = $2`;
    params.push(contaId);
  } else {
    query += ` ORDER BY conta_padrao DESC, id DESC LIMIT 1`;
  }

  const resultado = await pool.query(query, params);

  if (resultado.rows.length === 0) {
    throw new Error("Nenhuma conta Mercado Livre conectada");
  }

  return resultado.rows[0];
}

function obterSkuMercadoLivre(item: any): string | null {
  const sellerCustomField = item.seller_custom_field;

  const sellerSku = item.attributes?.find(
    (attr: any) => attr.id === "SELLER_SKU"
  )?.value_name;

  return sellerCustomField || sellerSku || null;
}

export async function importarAnunciosMercadoLivreService(
  usuarioId: number,
  contaId?: number | null
) {
  const conta = await obterContaAtiva(usuarioId, contaId);

  const itensResponse = await axios.get(
    `https://api.mercadolibre.com/users/${conta.ml_user_id}/items/search`,
    {
      headers: {
        Authorization: `Bearer ${conta.access_token}`
      },
      params: {
        limit: 50
      }
    }
  );

  const itemIds: string[] = itensResponse.data.results || [];

  let importados = 0;
  let pendentesSku = 0;

  for (const itemId of itemIds) {
    const itemResponse = await axios.get(
      `https://api.mercadolibre.com/items/${itemId}`,
      {
        headers: {
          Authorization: `Bearer ${conta.access_token}`
        }
      }
    );

    const item = itemResponse.data;
    const sku = obterSkuMercadoLivre(item);

    let produtoId: number | null = null;

    if (sku) {
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

      if (produtoResult.rows.length > 0) {
        produtoId = produtoResult.rows[0].id;
      }
    }

    if (!produtoId) {
      pendentesSku++;
    }

    await pool.query(
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
        status,
        url,
        permalink,
        categoria_ml,
        sincronizado,
        ultima_sincronizacao,
        vinculo_sku_status,
        dados_api
      )
      VALUES
      ($1,$2,$3,'mercado_livre',$4,$5,$6,'',$7,$8,$9,$10,$11,$12,$13,TRUE,CURRENT_TIMESTAMP,$14,$15)
      ON CONFLICT DO NOTHING
      `,
      [
        usuarioId,
        conta.id,
        produtoId,
        item.id,
        sku,
        item.title,
        item.listing_type_id,
        item.price || 0,
        item.available_quantity || 0,
        item.status || "unknown",
        item.permalink || null,
        item.permalink || null,
        item.category_id || null,
        produtoId ? "vinculado" : "pendente",
        item
      ]
    );

    importados++;
  }

  return {
    mensagem: "Importação concluída",
    total_encontrados: itemIds.length,
    importados,
    pendentes_sku: pendentesSku
  };
}