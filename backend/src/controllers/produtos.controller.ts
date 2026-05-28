import { Request, Response } from "express";
import { pool } from "../database/connection";

export async function criarProduto(req: Request, res: Response) {
  try {
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
      (sku, nome, descricao, preco_entrada, estoque_atual, estoque_minimo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [sku, nome, descricao, preco_entrada, estoque_atual, estoque_minimo]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (error) {
    return res.status(500).json({
      mensagem: "Erro ao criar produto",
      error
    });
  }
}

export async function listarProdutos(req: Request, res: Response) {
  try {
    const resultado = await pool.query(
      `
      SELECT *
      FROM produtos
      WHERE ativo = TRUE
      ORDER BY id DESC
      `
    );

    return res.json(resultado.rows);
  } catch (error) {
    return res.status(500).json({
      mensagem: "Erro ao listar produtos",
      error
    });
  }
}

export async function atualizarProduto(req: Request, res: Response) {
  try {
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
      RETURNING *
      `,
      [sku, nome, descricao, preco_entrada, estoque_atual, estoque_minimo, id]
    );

    return res.json(resultado.rows[0]);
  } catch (error) {
    return res.status(500).json({
      mensagem: "Erro ao atualizar produto",
      error
    });
  }
}

export async function desativarProduto(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE produtos
      SET ativo = FALSE,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [id]
    );

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