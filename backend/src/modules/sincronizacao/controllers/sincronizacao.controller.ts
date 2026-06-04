import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware";
import { pool } from "../../../database/connection";

export async function listarFilaSincronizacao(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;

    const resultado = await pool.query(
      `
      SELECT
        f.*,
        a.codigo_anuncio,
        a.titulo AS anuncio_titulo,
        a.sku_marketplace,
        c.nickname AS conta_nickname,
        c.nome_conta
      FROM fila_sincronizacao f
      LEFT JOIN anuncios a ON a.id = f.anuncio_id
      LEFT JOIN contas_mercado_livre c ON c.id = f.conta_mercado_livre_id
      WHERE f.usuario_id = $1
      ORDER BY f.id DESC
      LIMIT 200
      `,
      [usuarioId]
    );

    return res.json(resultado.rows);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao listar sincronizações"
    });
  }
}

export async function reenviarSincronizacao(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const { id } = req.params;

    const resultado = await pool.query(
      `
      UPDATE fila_sincronizacao
      SET
        status = 'pendente',
        erro = NULL,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $1
      AND usuario_id = $2
      RETURNING *
      `,
      [id, usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Item de sincronização não encontrado"
      });
    }

    return res.json({
      mensagem: "Item reenviado para a fila",
      item: resultado.rows[0]
    });
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao reenviar sincronização"
    });
  }
}