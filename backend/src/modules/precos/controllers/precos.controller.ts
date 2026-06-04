import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware";
import { obterContaMercadoLivreId } from "../../../shared/utils/contaMercadoLivre";

import {
  listarAnunciosPrecosService,
  reajustarPrecosService
} from "../services/precos.service";

export async function listarAnunciosPrecos(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const contaMercadoLivreId = obterContaMercadoLivreId(req);

    const anuncios = await listarAnunciosPrecosService(
      usuarioId,
      contaMercadoLivreId
    );

    return res.json(anuncios);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao listar preços"
    });
  }
}

export async function reajustarPrecos(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const contaMercadoLivreId = obterContaMercadoLivreId(req);

    const resultado = await reajustarPrecosService(
      usuarioId,
      req.body,
      contaMercadoLivreId
    );

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao reajustar preços"
    });
  }
}