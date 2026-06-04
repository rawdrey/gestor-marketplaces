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

export async function importarVendasMercadoLivreService(
  usuarioId: number,
  contaId?: number | null
) {
  const conta = await obterContaAtiva(usuarioId, contaId);

  const pedidosResponse = await axios.get(
    "https://api.mercadolibre.com/orders/search",
    {
      headers: {
        Authorization: `Bearer ${conta.access_token}`
      },
      params: {
        seller: conta.ml_user_id,
        sort: "date_desc",
        limit: 50
      }
    }
  );

  const pedidos = pedidosResponse.data.results || [];

  let importadas = 0;
  let ignoradas = 0;
  let semSku = 0;

  for (const pedido of pedidos) {
    const codigoVenda = String(pedido.id);

    const vendaExistente = await pool.query(
      `
      SELECT id
      FROM vendas
      WHERE usuario_id = $1
      AND codigo_venda = $2
      `,
      [usuarioId, codigoVenda]
    );

    if (vendaExistente.rows.length > 0) {
      ignoradas++;
      continue;
    }

    const item = pedido.order_items?.[0];

    if (!item) {
      ignoradas++;
      continue;
    }

    const itemId = item.item?.id;
    const quantidade = Number(item.quantity || 1);
    const valorBruto = Number(item.unit_price || 0) * quantidade;

    const anuncioResult = await pool.query(
      `
      SELECT
        a.*,
        p.preco_entrada,
        p.custo_medio,
        p.tipo_produto
      FROM anuncios a
      LEFT JOIN produtos p ON p.id = a.produto_id
      WHERE a.usuario_id = $1
      AND a.codigo_anuncio = $2
      LIMIT 1
      `,
      [usuarioId, itemId]
    );

    if (anuncioResult.rows.length === 0) {
      semSku++;
      continue;
    }

    const anuncio = anuncioResult.rows[0];

    if (!anuncio.produto_id) {
      semSku++;
      continue;
    }

    const produtoResult = await pool.query(
      `
      SELECT *
      FROM produtos
      WHERE id = $1
      AND usuario_id = $2
      AND ativo = TRUE
      `,
      [anuncio.produto_id, usuarioId]
    );

    if (produtoResult.rows.length === 0) {
      semSku++;
      continue;
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

    const percentualImposto = Number(config.percentual_imposto || 0);
    const embalagem = Number(config.custo_embalagem_padrao || 0);
    const outrosGastos = Number(config.outros_gastos_padrao || 0);

    const taxaMarketplace =
      Number(pedido.payments?.[0]?.marketplace_fee || 0) ||
      Number(anuncio.taxa_marketplace_prevista || 0);

    const freteDescontado =
      Number(pedido.shipping?.cost || 0) ||
      Number(anuncio.frete_previsto || 0);

    const imposto = valorBruto * (percentualImposto / 100);

    const custoUnitario = Number(
      produto.custo_medio || produto.preco_entrada || 0
    );

    const custoProduto = custoUnitario * quantidade;

    const valorLiquido =
      valorBruto -
      taxaMarketplace -
      freteDescontado;

    const lucro =
      valorBruto -
      taxaMarketplace -
      freteDescontado -
      imposto -
      embalagem -
      outrosGastos -
      custoProduto;

    const margemLucro = valorBruto > 0 ? (lucro / valorBruto) * 100 : 0;

    await pool.query("BEGIN");

    try {
      const vendaResult = await pool.query(
        `
        INSERT INTO vendas
        (
          usuario_id,
          conta_mercado_livre_id,
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
          margem_lucro,
          origem_api,
          dados_api
        )
        VALUES
        ($1,$2,$3,$4,'mercado_livre',$5,$6,$7,$8,$9,$10,0,$11,$12,$13,$14,$15,$16,$17,$18,TRUE,$19)
        RETURNING *
        `,
        [
          usuarioId,
          conta.id,
          produto.id,
          anuncio.id,
          codigoVenda,
          quantidade,
          valorBruto,
          valorBruto,
          valorLiquido,
          taxaMarketplace,
          freteDescontado,
          freteDescontado,
          imposto,
          embalagem,
          outrosGastos,
          custoProduto,
          lucro,
          margemLucro,
          pedido
        ]
      );

      const venda = vendaResult.rows[0];

      const estoqueAnterior = Number(produto.estoque_atual || 0);

      if (estoqueAnterior < quantidade) {
        throw new Error(`Estoque insuficiente para SKU ${produto.sku}`);
      }

      const estoqueNovo = estoqueAnterior - quantidade;

      await pool.query(
        `
        UPDATE produtos
        SET estoque_atual = $1,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $2
        AND usuario_id = $3
        `,
        [estoqueNovo, produto.id, usuarioId]
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
        VALUES ($1,$2,$3,'saida_venda',$4,$5,$6,$7)
        `,
        [
          usuarioId,
          produto.id,
          venda.id,
          quantidade,
          estoqueAnterior,
          estoqueNovo,
          "Baixa automática por venda importada do Mercado Livre"
        ]
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
          conta.id,
          JSON.stringify({
            produto_id: produto.id,
            sku: produto.sku,
            estoque: estoqueNovo,
            origem: "venda_mercado_livre"
          })
        ]
      );

      await pool.query("COMMIT");

      importadas++;
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }

  return {
    mensagem: "Importação de vendas concluída",
    total_encontradas: pedidos.length,
    importadas,
    ignoradas_duplicadas: ignoradas,
    ignoradas_sem_sku: semSku
  };
}