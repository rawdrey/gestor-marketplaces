import { Response } from "express";
import { pool } from "../database/connection";
import { AuthRequest } from "../shared/middlewares/auth.middleware";

export async function criarProduto(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id;

    const {
      sku,
      nome,
      descricao,
      preco_entrada,
      estoque_atual,
      estoque_minimo
    } = req.body;

    const resultado = await pool.query(
      `
      INSERT INTO produtos 
      (usuario_id, sku, nome, descricao, preco_entrada, estoque_atual, estoque_minimo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        usuarioId,
        sku,
        nome,
        descricao,
        preco_entrada,
        estoque_atual,
        estoque_minimo
      ]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (error) {
    return res.status(500).json({
      mensagem: "Erro ao criar produto",
      error
    });
  }
}

export async function listarProdutos(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id;

    const resultado = await pool.query(
      `
      SELECT *
      FROM produtos
      WHERE ativo = TRUE
      AND usuario_id = $1
      ORDER BY id DESC
      `,
      [usuarioId]
    );

    return res.json(resultado.rows);
  } catch (error) {
    return res.status(500).json({
      mensagem: "Erro ao listar produtos",
      error
    });
  }
}

export async function atualizarProduto(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id;
    const { id } = req.params;

    const {
      sku,
      nome,
      descricao,
      preco_entrada,
      estoque_atual,
      estoque_minimo
    } = req.body;

    const resultado = await pool.query(
      `
      UPDATE produtos
      SET
        sku = $1,
        nome = $2,
        descricao = $3,
        preco_entrada = $4,
        estoque_atual = $5,
        estoque_minimo = $6,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $7
      AND usuario_id = $8
      RETURNING *
      `,
      [
        sku,
        nome,
        descricao,
        preco_entrada,
        estoque_atual,
        estoque_minimo,
        id,
        usuarioId
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Produto não encontrado"
      });
    }

    return res.json(resultado.rows[0]);
  } catch (error) {
    return res.status(500).json({
      mensagem: "Erro ao atualizar produto",
      error
    });
  }
}

export async function desativarProduto(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id;
    const { id } = req.params;

    const resultado = await pool.query(
      `
      UPDATE produtos
      SET ativo = FALSE,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $1
      AND usuario_id = $2
      RETURNING *
      `,
      [id, usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Produto não encontrado"
      });
    }

    return res.json({
      mensagem: "Produto desativado com sucesso"
    });
  } catch (error) {
    return res.status(500).json({
      mensagem: "Erro ao desativar produto",
      error
    });
  }
}