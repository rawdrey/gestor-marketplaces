import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware";

import {
  registrarVendaService,
  listarVendasService
} from "../services/vendas.service";

export async function registrarVenda(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;

    const venda = await registrarVendaService(usuarioId, req.body);

    return res.status(201).json({
      mensagem: "Venda registrada com sucesso",
      venda
    });
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao registrar venda"
    });
  }
}

export async function listarVendas(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;

    const vendas = await listarVendasService(usuarioId);

    return res.json(vendas);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao listar vendas"
    });
  }
}