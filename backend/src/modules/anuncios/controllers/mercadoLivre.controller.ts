import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware";

import {
  gerarUrlAutorizacaoService,
  salvarContaMercadoLivreService,
  listarContasMercadoLivreService,
  definirContaPadraoService,
  desativarContaMercadoLivreService
} from "../services/mercadoLivre.service";

export async function gerarUrlAutorizacao(req: AuthRequest, res: Response) {
  try {
    const url = await gerarUrlAutorizacaoService();

    return res.json({ url });
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao gerar URL de autorização"
    });
  }
}

export async function callbackMercadoLivre(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const { code } = req.query;

    if (!code) {
      throw new Error("Code não informado pelo Mercado Livre");
    }

    await salvarContaMercadoLivreService(usuarioId, String(code));

    return res.redirect(
      `${process.env.FRONTEND_URL}/mercado-livre?conectado=true`
    );
  } catch (error: any) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/mercado-livre?erro=${encodeURIComponent(
        error.message || "erro"
      )}`
    );
  }
}

export async function listarContasMercadoLivre(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;

    const contas = await listarContasMercadoLivreService(usuarioId);

    return res.json(contas);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao listar contas"
    });
  }
}

export async function definirContaPadrao(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const { id } = req.params;

    const conta = await definirContaPadraoService(usuarioId, Number(id));

    return res.json({
      mensagem: "Conta padrão definida com sucesso",
      conta
    });
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao definir conta padrão"
    });
  }
}

export async function desativarContaMercadoLivre(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const { id } = req.params;

    const conta = await desativarContaMercadoLivreService(usuarioId, Number(id));

    return res.json({
      mensagem: "Conta desativada com sucesso",
      conta
    });
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao desativar conta"
    });
  }
}