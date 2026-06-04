import dotenv from "dotenv";
import { pool } from "../database/connection";
import { mercadoLivrePut } from "../modules/mercadoLivre/services/mercadoLivreApi.service";

dotenv.config();

async function buscarItemPendente() {
  const resultado = await pool.query(
    `
    SELECT *
    FROM fila_sincronizacao
    WHERE status = 'pendente'
    AND tentativa < 5
    ORDER BY id ASC
    LIMIT 1
    `
  );

  return resultado.rows[0];
}

async function atualizarMercadoLivre(
  usuarioId: number,
  contaId: number,
  codigoAnuncio: string,
  payload: any,
  tipo: string
) {
  if (tipo === "descricao") {
    return mercadoLivrePut(
      usuarioId,
      contaId,
      `/items/${codigoAnuncio}/description`,
      {
        plain_text: payload.descricao || ""
      }
    );
  }

  const body =
    tipo === "preco"
      ? { price: Number(payload.preco || 0) }
      : tipo === "titulo"
      ? { title: payload.titulo }
      : tipo === "status"
      ? { status: payload.status }
      : tipo === "fotos"
      ? { pictures: payload.pictures || [] }
      : tipo === "atributos"
      ? { attributes: payload.attributes || [] }
      : tipo === "medidas"
      ? {
          dimensions: {
            height: payload.medidas?.altura,
            width: payload.medidas?.largura,
            length: payload.medidas?.comprimento,
            weight: payload.medidas?.peso
          }
        }
      : { available_quantity: Number(payload.estoque || 0) };

  return mercadoLivrePut(
    usuarioId,
    contaId,
    `/items/${codigoAnuncio}`,
    body
  );
}

async function processarItem(item: any) {
  const payload =
    typeof item.payload === "string"
      ? JSON.parse(item.payload)
      : item.payload;

  const anuncioResult = await pool.query(
    `
    SELECT *
    FROM anuncios
    WHERE id = $1
    `,
    [item.anuncio_id]
  );

  if (anuncioResult.rows.length === 0) {
    throw new Error("Anúncio não encontrado");
  }

  const anuncio = anuncioResult.rows[0];

  if (!anuncio.codigo_anuncio) {
    throw new Error("Anúncio sem código Mercado Livre");
  }

  if (!item.conta_mercado_livre_id) {
    throw new Error("Fila sem conta Mercado Livre vinculada");
  }

  const resposta = await atualizarMercadoLivre(
    item.usuario_id,
    item.conta_mercado_livre_id,
    anuncio.codigo_anuncio,
    payload,
    item.tipo
  );

  await pool.query(
    `
    UPDATE fila_sincronizacao
    SET
      status = 'enviado',
      resposta_api = $1,
      processado_em = CURRENT_TIMESTAMP,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE id = $2
    `,
    [resposta, item.id]
  );

  if (item.tipo === "estoque") {
    await pool.query(
      `
      UPDATE anuncios
      SET
        sincronizado = TRUE,
        ultima_sincronizacao = CURRENT_TIMESTAMP,
        estoque_sincronizado = $1,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [Number(payload.estoque || 0), anuncio.id]
    );
  }

  if (item.tipo === "preco") {
    await pool.query(
      `
      UPDATE anuncios
      SET
        sincronizado = TRUE,
        ultima_sincronizacao = CURRENT_TIMESTAMP,
        preco_sincronizado = $1,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [Number(payload.preco || 0), anuncio.id]
    );
  }
}

async function marcarErro(item: any, error: any) {
  await pool.query(
    `
    UPDATE fila_sincronizacao
    SET
      status = CASE
        WHEN tentativa + 1 >= 5 THEN 'erro'
        ELSE 'pendente'
      END,
      tentativa = tentativa + 1,
      erro = $1,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE id = $2
    `,
    [error.message || "Erro desconhecido", item.id]
  );
}

async function executarWorker() {
  console.log("Worker Mercado Livre iniciado");

  while (true) {
    const item = await buscarItemPendente();

    if (!item) {
      console.log("Nenhum item pendente. Aguardando...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      continue;
    }

    try {
      console.log(`Processando fila ${item.id} - tipo ${item.tipo}`);
      await processarItem(item);
      console.log(`Fila ${item.id} enviada com sucesso`);
    } catch (error: any) {
      console.log(`Erro na fila ${item.id}: ${error.message}`);
      await marcarErro(item, error);
    }
  }
}

executarWorker();