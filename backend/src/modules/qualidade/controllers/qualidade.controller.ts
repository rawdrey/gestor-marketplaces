import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware";
import { obterContaMercadoLivreId } from "../../../shared/utils/contaMercadoLivre";

import {
  atualizarQualidadeAnunciosService,
  obterResumoQualidadeService,
  listarAnunciosQualidadeService
} from "../services/qualidade.service";

export async function atualizarQualidadeAnuncios(
  req: AuthRequest,
  res: Response
) {
  try {
    const usuarioId = req.usuario?.id as number;
    const contaMercadoLivreId = obterContaMercadoLivreId(req);

    const resultado = await atualizarQualidadeAnunciosService(
      usuarioId,
      contaMercadoLivreId
    );

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao atualizar qualidade"
    });
  }
}

export async function obterResumoQualidade(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const contaMercadoLivreId = obterContaMercadoLivreId(req);

    const resumo = await obterResumoQualidadeService(
      usuarioId,
      contaMercadoLivreId
    );

    return res.json(resumo);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao carregar qualidade"
    });
  }
}

export async function listarAnunciosQualidade(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const contaMercadoLivreId = obterContaMercadoLivreId(req);
    const { status } = req.query;

    const anuncios = await listarAnunciosQualidadeService(
      usuarioId,
      contaMercadoLivreId,
      String(status || "todos")
    );

    return res.json(anuncios);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao listar anúncios"
    });
  }
}