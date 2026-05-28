import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware";

import {
  obterConfiguracoesService,
  atualizarConfiguracoesService
} from "../services/configuracoes.service";

export async function obterConfiguracoes(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;

    const configuracoes = await obterConfiguracoesService(usuarioId);

    return res.json(configuracoes);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao carregar configurações"
    });
  }
}

export async function atualizarConfiguracoes(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;

    const configuracoes = await atualizarConfiguracoesService(
      usuarioId,
      req.body
    );

    return res.json({
      mensagem: "Configurações atualizadas com sucesso",
      configuracoes
    });
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao atualizar configurações"
    });
  }
}