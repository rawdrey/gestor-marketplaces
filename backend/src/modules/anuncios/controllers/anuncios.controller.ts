import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware";

import {
  criarAnuncioService,
  listarAnunciosService,
  atualizarAnuncioService,
  desativarAnuncioService,
  clonarAnuncioService
} from "../services/anuncios.service";

export async function criarAnuncio(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const anuncio = await criarAnuncioService(usuarioId, req.body);
    return res.status(201).json(anuncio);
  } catch (error: any) {
    return res.status(400).json({ mensagem: error.message });
  }
}

export async function listarAnuncios(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const anuncios = await listarAnunciosService(usuarioId);
    return res.json(anuncios);
  } catch (error: any) {
    return res.status(400).json({ mensagem: error.message });
  }
}

export async function atualizarAnuncio(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const { id } = req.params;

    const anuncio = await atualizarAnuncioService(
      usuarioId,
      Number(id),
      req.body
    );

    return res.json(anuncio);
  } catch (error: any) {
    return res.status(400).json({ mensagem: error.message });
  }
}

export async function desativarAnuncio(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const { id } = req.params;

    await desativarAnuncioService(usuarioId, Number(id));

    return res.json({
      mensagem: "Anúncio desativado com sucesso"
    });
  } catch (error: any) {
    return res.status(400).json({ mensagem: error.message });
  }
}

export async function clonarAnuncio(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const { id } = req.params;

    const anuncio = await clonarAnuncioService(
      usuarioId,
      Number(id),
      req.body
    );

    return res.status(201).json({
      mensagem: "Anúncio clonado com sucesso",
      anuncio
    });
  } catch (error: any) {
    return res.status(400).json({ mensagem: error.message });
  }
}