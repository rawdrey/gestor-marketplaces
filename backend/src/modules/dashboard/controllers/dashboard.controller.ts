import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware";
import { obterResumoDashboardService } from "../services/dashboard.service";

export async function obterResumoDashboard(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;

    const resumo = await obterResumoDashboardService(usuarioId);

    return res.json(resumo);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao carregar dashboard"
    });
  }
}