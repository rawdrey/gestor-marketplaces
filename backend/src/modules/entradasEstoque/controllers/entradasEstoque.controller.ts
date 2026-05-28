import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware";

import {
  registrarEntradaEstoqueService,
  listarEntradasEstoqueService
} from "../services/entradasEstoque.service";

export async function registrarEntradaEstoque(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;

    const entrada = await registrarEntradaEstoqueService(usuarioId, req.body);

    return res.status(201).json({
      mensagem: "Entrada de estoque registrada com sucesso",
      entrada
    });
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao registrar entrada de estoque"
    });
  }
}

export async function listarEntradasEstoque(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;

    const entradas = await listarEntradasEstoqueService(usuarioId);

    return res.json(entradas);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao listar entradas de estoque"
    });
  }
}