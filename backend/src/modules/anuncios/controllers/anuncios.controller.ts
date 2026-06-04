import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware";
import { obterContaMercadoLivreId } from "../../../shared/utils/contaMercadoLivre";

import {
  criarAnuncioService,
  listarAnunciosService,
  atualizarAnuncioService,
  desativarAnuncioService,
  clonarAnuncioService,
  buscarAnuncioParaClonarService,
  listarAnunciosPendentesSkuService,
  vincularSkuAutomaticamenteService,
  vincularSkuAnuncioService
} from "../services/anuncios.service";
export async function criarAnuncio(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const contaMercadoLivreId = obterContaMercadoLivreId(req);

    const anuncio = await criarAnuncioService(
      usuarioId,
      req.body,
      contaMercadoLivreId
    );

    return res.status(201).json(anuncio);
  } catch (error: any) {
    return res.status(400).json({ mensagem: error.message });
  }
}

export async function listarAnuncios(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const contaMercadoLivreId = obterContaMercadoLivreId(req);

    const anuncios = await listarAnunciosService(usuarioId, contaMercadoLivreId);

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
    const contaMercadoLivreId = obterContaMercadoLivreId(req);
    const { id } = req.params;

    const anuncio = await clonarAnuncioService(
      usuarioId,
      Number(id),
      req.body,
      contaMercadoLivreId
    );

    return res.status(201).json({
      mensagem: "Anúncio clonado com sucesso",
      anuncio
    });
  } catch (error: any) {
    return res.status(400).json({ mensagem: error.message });
  }
}

export async function buscarAnuncioParaClonar(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const contaMercadoLivreId = obterContaMercadoLivreId(req);
    const { termo } = req.query;

    const anuncio = await buscarAnuncioParaClonarService(
      usuarioId,
      String(termo),
      contaMercadoLivreId
    );

    return res.json(anuncio);
  } catch (error: any) {
    return res.status(404).json({
      mensagem: error.message || "Anúncio não encontrado"
    });
  }
}

export async function vincularSkuAnuncio(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const { id } = req.params;
    const { sku } = req.body;

    const anuncio = await vincularSkuAnuncioService(
      usuarioId,
      Number(id),
      sku
    );

    return res.json({
      mensagem: "SKU vinculado com sucesso",
      anuncio
    });
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao vincular SKU"
    });
  }
}

export async function listarAnunciosPendentesSku(
  req: AuthRequest,
  res: Response
) {
  try {
    const usuarioId = req.usuario?.id as number;
    const contaMercadoLivreId = obterContaMercadoLivreId(req);

    const anuncios = await listarAnunciosPendentesSkuService(
      usuarioId,
      contaMercadoLivreId
    );

    return res.json(anuncios);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao listar anúncios pendentes"
    });
  }
}

export async function vincularSkuAutomaticamente(
  req: AuthRequest,
  res: Response
) {
  try {
    const usuarioId = req.usuario?.id as number;
    const contaMercadoLivreId = obterContaMercadoLivreId(req);

    const resultado = await vincularSkuAutomaticamenteService(
      usuarioId,
      contaMercadoLivreId
    );

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao vincular automaticamente"
    });
  }
}