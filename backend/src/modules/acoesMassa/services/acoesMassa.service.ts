import { pool } from "../../../database/connection";

function numero(valor: any): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function calcularPreco(precoAtual: number, operacao: string, tipo: string, valor: number) {
  if (tipo === "percentual") {
    const delta = precoAtual * (valor / 100);
    return operacao === "reduzir" ? precoAtual - delta : precoAtual + delta;
  }

  return operacao === "reduzir" ? precoAtual - valor : precoAtual + valor;
}

export async function listarAnunciosAcoesMassaService(usuarioId: number) {
  const resultado = await pool.query(
    `
    SELECT
      a.id,
      a.codigo_anuncio,
      a.titulo,
      a.sku_marketplace,
      a.preco_venda,
      a.estoque_anuncio,
      a.status,
      a.categoria_ml,
      a.qualidade_score,
      a.qualidade_status,
      a.sincronizado,
      a.conta_mercado_livre_id,
      c.nickname AS conta_nickname,
      c.nome_conta
    FROM anuncios a
    LEFT JOIN contas_mercado_livre c ON c.id = a.conta_mercado_livre_id
    WHERE a.usuario_id = $1
    AND a.status <> 'desativado'
    ORDER BY a.id DESC
    `,
    [usuarioId]
  );

  return resultado.rows;
}

async function buscarAnunciosSelecionados(usuarioId: number, anuncioIds: number[]) {
  if (!Array.isArray(anuncioIds) || anuncioIds.length === 0) {
    throw new Error("Nenhum anúncio selecionado");
  }

  const resultado = await pool.query(
    `
    SELECT *
    FROM anuncios
    WHERE usuario_id = $1
    AND id = ANY($2)
    AND status <> 'desativado'
    `,
    [usuarioId, anuncioIds]
  );

  return resultado.rows;
}

export async function reajustarPrecoMassaService(usuarioId: number, data: any) {
  const { anuncio_ids, operacao, tipo_reajuste, valor_reajuste, enviar_sync } = data;

  const anuncios = await buscarAnunciosSelecionados(usuarioId, anuncio_ids);
  const valor = numero(valor_reajuste);

  if (valor <= 0) {
    throw new Error("Valor de reajuste inválido");
  }

  let atualizados = 0;
  let enfileirados = 0;

  await pool.query("BEGIN");

  try {
    for (const anuncio of anuncios) {
      const precoAnterior = numero(anuncio.preco_venda);
      const precoNovo = calcularPreco(
        precoAnterior,
        operacao || "aumentar",
        tipo_reajuste || "percentual",
        valor
      );

      if (precoNovo <= 0) continue;

      await pool.query(
        `
        UPDATE anuncios
        SET preco_venda = $1,
            sincronizado = FALSE,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $2
        AND usuario_id = $3
        `,
        [precoNovo, anuncio.id, usuarioId]
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
          valor_reajuste,
          modo
        )
        VALUES ($1,$2,$3,$4,$5,$6,'acoes_massa')
        `,
        [
          usuarioId,
          anuncio.id,
          precoAnterior,
          precoNovo,
          tipo_reajuste || "percentual",
          valor
        ]
      );

      atualizados++;

      if (enviar_sync && anuncio.conta_mercado_livre_id) {
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
              preco: precoNovo,
              origem: "acoes_massa"
            })
          ]
        );

        enfileirados++;
      }
    }

    await pool.query("COMMIT");

    return { mensagem: "Preços atualizados", atualizados, enfileirados };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function alterarEstoqueMassaService(usuarioId: number, data: any) {
  const { anuncio_ids, modo, valor, enviar_sync } = data;

  const anuncios = await buscarAnunciosSelecionados(usuarioId, anuncio_ids);
  const quantidade = numero(valor);

  if (quantidade < 0) {
    throw new Error("Valor de estoque inválido");
  }

  let atualizados = 0;
  let enfileirados = 0;

  await pool.query("BEGIN");

  try {
    for (const anuncio of anuncios) {
      const estoqueAtual = numero(anuncio.estoque_anuncio);

      let estoqueNovo = quantidade;

      if (modo === "somar") {
        estoqueNovo = estoqueAtual + quantidade;
      }

      if (modo === "subtrair") {
        estoqueNovo = Math.max(0, estoqueAtual - quantidade);
      }

      await pool.query(
        `
        UPDATE anuncios
        SET estoque_anuncio = $1,
            sincronizado = FALSE,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $2
        AND usuario_id = $3
        `,
        [estoqueNovo, anuncio.id, usuarioId]
      );

      atualizados++;

      if (enviar_sync && anuncio.conta_mercado_livre_id) {
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
              anuncio_id: anuncio.id,
              codigo_anuncio: anuncio.codigo_anuncio,
              estoque: estoqueNovo,
              origem: "acoes_massa"
            })
          ]
        );

        enfileirados++;
      }
    }

    await pool.query("COMMIT");

    return { mensagem: "Estoques atualizados", atualizados, enfileirados };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function alterarStatusMassaService(
  usuarioId: number,
  anuncioIds: number[],
  novoStatus: "active" | "paused"
) {
  const anuncios = await buscarAnunciosSelecionados(usuarioId, anuncioIds);

  let atualizados = 0;
  let enfileirados = 0;

  await pool.query("BEGIN");

  try {
    for (const anuncio of anuncios) {
      await pool.query(
        `
        UPDATE anuncios
        SET status = $1,
            sincronizado = FALSE,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $2
        AND usuario_id = $3
        `,
        [novoStatus, anuncio.id, usuarioId]
      );

      atualizados++;

      if (anuncio.conta_mercado_livre_id) {
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
          VALUES ($1,$2,$3,'mercado_livre','status',$4)
          `,
          [
            usuarioId,
            anuncio.id,
            anuncio.conta_mercado_livre_id,
            JSON.stringify({
              anuncio_id: anuncio.id,
              codigo_anuncio: anuncio.codigo_anuncio,
              status: novoStatus,
              origem: "acoes_massa"
            })
          ]
        );

        enfileirados++;
      }
    }

    await pool.query("COMMIT");

    return { mensagem: "Status atualizados", atualizados, enfileirados };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function sincronizarSelecionadosMassaService(
  usuarioId: number,
  anuncioIds: number[]
) {
  const anuncios = await buscarAnunciosSelecionados(usuarioId, anuncioIds);

  let enfileirados = 0;

  await pool.query("BEGIN");

  try {
    for (const anuncio of anuncios) {
      if (!anuncio.conta_mercado_livre_id) continue;

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
        VALUES
        ($1,$2,$3,'mercado_livre','preco',$4),
        ($1,$2,$3,'mercado_livre','estoque',$5)
        `,
        [
          usuarioId,
          anuncio.id,
          anuncio.conta_mercado_livre_id,
          JSON.stringify({
            anuncio_id: anuncio.id,
            codigo_anuncio: anuncio.codigo_anuncio,
            preco: Number(anuncio.preco_venda || 0),
            origem: "acoes_massa"
          }),
          JSON.stringify({
            anuncio_id: anuncio.id,
            codigo_anuncio: anuncio.codigo_anuncio,
            estoque: Number(anuncio.estoque_anuncio || 0),
            origem: "acoes_massa"
          })
        ]
      );

      await pool.query(
        `
        UPDATE anuncios
        SET sincronizado = FALSE,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $1
        AND usuario_id = $2
        `,
        [anuncio.id, usuarioId]
      );

      enfileirados += 2;
    }

    await pool.query("COMMIT");

    return { mensagem: "Anúncios enviados para sincronização", enfileirados };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

function aplicarTextoAtualizado(
  textoAtual: string,
  modo: string,
  valor: string,
  procurar?: string
) {
  const texto = textoAtual || "";
  const v = valor || "";

  if (modo === "prefixo") {
    return `${v}${texto}`;
  }

  if (modo === "sufixo") {
    return `${texto}${v}`;
  }

  if (modo === "substituir") {
    if (!procurar) return texto;
    return texto.replaceAll(procurar, v);
  }

  if (modo === "trocar_tudo") {
    return v;
  }

  return texto;
}

export async function alterarTituloMassaService(usuarioId: number, data: any) {
  const { anuncio_ids, modo, valor, procurar, enviar_sync } = data;
  const anuncios = await buscarAnunciosSelecionados(usuarioId, anuncio_ids);

  let atualizados = 0;
  let enfileirados = 0;

  await pool.query("BEGIN");

  try {
    for (const anuncio of anuncios) {
      const tituloNovo = aplicarTextoAtualizado(
        anuncio.titulo,
        modo,
        valor,
        procurar
      );

      await pool.query(
        `
        UPDATE anuncios
        SET titulo = $1,
            sincronizado = FALSE,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $2
        AND usuario_id = $3
        `,
        [tituloNovo, anuncio.id, usuarioId]
      );

      atualizados++;

      if (enviar_sync && anuncio.conta_mercado_livre_id) {
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
          VALUES ($1,$2,$3,'mercado_livre','titulo',$4)
          `,
          [
            usuarioId,
            anuncio.id,
            anuncio.conta_mercado_livre_id,
            JSON.stringify({
              anuncio_id: anuncio.id,
              codigo_anuncio: anuncio.codigo_anuncio,
              titulo: tituloNovo,
              origem: "acoes_massa_conteudo"
            })
          ]
        );

        enfileirados++;
      }
    }

    await pool.query("COMMIT");

    return { mensagem: "Títulos atualizados", atualizados, enfileirados };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function alterarDescricaoMassaService(usuarioId: number, data: any) {
  const { anuncio_ids, modo, valor, procurar, enviar_sync } = data;
  const anuncios = await buscarAnunciosSelecionados(usuarioId, anuncio_ids);

  let atualizados = 0;
  let enfileirados = 0;

  await pool.query("BEGIN");

  try {
    for (const anuncio of anuncios) {
      const descricaoNova = aplicarTextoAtualizado(
        anuncio.descricao,
        modo,
        valor,
        procurar
      );

      await pool.query(
        `
        UPDATE anuncios
        SET descricao = $1,
            sincronizado = FALSE,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $2
        AND usuario_id = $3
        `,
        [descricaoNova, anuncio.id, usuarioId]
      );

      atualizados++;

      if (enviar_sync && anuncio.conta_mercado_livre_id) {
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
          VALUES ($1,$2,$3,'mercado_livre','descricao',$4)
          `,
          [
            usuarioId,
            anuncio.id,
            anuncio.conta_mercado_livre_id,
            JSON.stringify({
              anuncio_id: anuncio.id,
              codigo_anuncio: anuncio.codigo_anuncio,
              descricao: descricaoNova,
              origem: "acoes_massa_conteudo"
            })
          ]
        );

        enfileirados++;
      }
    }

    await pool.query("COMMIT");

    return { mensagem: "Descrições atualizadas", atualizados, enfileirados };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function alterarFotosMassaService(usuarioId: number, data: any) {
  const { anuncio_ids, fotos, modo, enviar_sync } = data;
  const anuncios = await buscarAnunciosSelecionados(usuarioId, anuncio_ids);

  if (!Array.isArray(fotos) || fotos.length === 0) {
    throw new Error("Informe ao menos uma foto");
  }

  let atualizados = 0;
  let enfileirados = 0;

  await pool.query("BEGIN");

  try {
    for (const anuncio of anuncios) {
      const fotosPayload = fotos.map((foto: string) => ({
        source: foto
      }));

      await pool.query(
        `
        UPDATE anuncios
        SET fotos_massa = $1,
            sincronizado = FALSE,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $2
        AND usuario_id = $3
        `,
        [JSON.stringify(fotosPayload), anuncio.id, usuarioId]
      );

      atualizados++;

      if (enviar_sync && anuncio.conta_mercado_livre_id) {
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
          VALUES ($1,$2,$3,'mercado_livre','fotos',$4)
          `,
          [
            usuarioId,
            anuncio.id,
            anuncio.conta_mercado_livre_id,
            JSON.stringify({
              anuncio_id: anuncio.id,
              codigo_anuncio: anuncio.codigo_anuncio,
              pictures: fotosPayload,
              modo: modo || "substituir",
              origem: "acoes_massa_fotos"
            })
          ]
        );

        enfileirados++;
      }
    }

    await pool.query("COMMIT");

    return { mensagem: "Fotos atualizadas", atualizados, enfileirados };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function alterarAtributosMassaService(usuarioId: number, data: any) {
  const { anuncio_ids, marca, modelo, cor, gtin, enviar_sync } = data;
  const anuncios = await buscarAnunciosSelecionados(usuarioId, anuncio_ids);

  const atributos = [];

  if (marca) atributos.push({ id: "BRAND", value_name: marca });
  if (modelo) atributos.push({ id: "MODEL", value_name: modelo });
  if (cor) atributos.push({ id: "COLOR", value_name: cor });
  if (gtin) atributos.push({ id: "GTIN", value_name: gtin });

  if (atributos.length === 0) {
    throw new Error("Informe ao menos um atributo");
  }

  let atualizados = 0;
  let enfileirados = 0;

  await pool.query("BEGIN");

  try {
    for (const anuncio of anuncios) {
      await pool.query(
        `
        UPDATE anuncios
        SET atributos_massa = $1,
            sincronizado = FALSE,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $2
        AND usuario_id = $3
        `,
        [JSON.stringify(atributos), anuncio.id, usuarioId]
      );

      atualizados++;

      if (enviar_sync && anuncio.conta_mercado_livre_id) {
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
          VALUES ($1,$2,$3,'mercado_livre','atributos',$4)
          `,
          [
            usuarioId,
            anuncio.id,
            anuncio.conta_mercado_livre_id,
            JSON.stringify({
              anuncio_id: anuncio.id,
              codigo_anuncio: anuncio.codigo_anuncio,
              attributes: atributos,
              origem: "acoes_massa_atributos"
            })
          ]
        );

        enfileirados++;
      }
    }

    await pool.query("COMMIT");

    return { mensagem: "Atributos atualizados", atualizados, enfileirados };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function alterarMedidasMassaService(usuarioId: number, data: any) {
  const {
    anuncio_ids,
    peso,
    altura,
    largura,
    comprimento,
    enviar_sync
  } = data;

  const anuncios = await buscarAnunciosSelecionados(usuarioId, anuncio_ids);

  const medidas = {
    peso: peso || null,
    altura: altura || null,
    largura: largura || null,
    comprimento: comprimento || null
  };

  let atualizados = 0;
  let enfileirados = 0;

  await pool.query("BEGIN");

  try {
    for (const anuncio of anuncios) {
      await pool.query(
        `
        UPDATE anuncios
        SET medidas_massa = $1,
            sincronizado = FALSE,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $2
        AND usuario_id = $3
        `,
        [JSON.stringify(medidas), anuncio.id, usuarioId]
      );

      atualizados++;

      if (enviar_sync && anuncio.conta_mercado_livre_id) {
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
          VALUES ($1,$2,$3,'mercado_livre','medidas',$4)
          `,
          [
            usuarioId,
            anuncio.id,
            anuncio.conta_mercado_livre_id,
            JSON.stringify({
              anuncio_id: anuncio.id,
              codigo_anuncio: anuncio.codigo_anuncio,
              medidas,
              origem: "acoes_massa_medidas"
            })
          ]
        );

        enfileirados++;
      }
    }

    await pool.query("COMMIT");

    return { mensagem: "Medidas atualizadas", atualizados, enfileirados };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}