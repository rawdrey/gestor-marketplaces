import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware";

import {
  listarEstoqueCompartilhadoService,
  sincronizarSkuCompartilhadoService
} from "../services/estoqueCompartilhado.service";

export async function listarEstoqueCompartilhado(
  req: AuthRequest,
  res: Response
) {
  try {
    const usuarioId = req.usuario?.id as number;

    const itens = await listarEstoqueCompartilhadoService(usuarioId);

    return res.json(itens);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao listar estoque compartilhado"
    });
  }
}

export async function sincronizarSkuCompartilhado(
  req: AuthRequest,
  res: Response
) {
  try {
    const usuarioId = req.usuario?.id as number;
    const { produtoId } = req.params;

    const resultado = await sincronizarSkuCompartilhadoService(
      usuarioId,
      Number(produtoId)
    );

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao sincronizar SKU"
    });
  }
}