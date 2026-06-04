import { Response } from "express";
import { AuthRequest } from "../../../shared/middlewares/auth.middleware";

import {
  listarAnunciosAcoesMassaService,
  reajustarPrecoMassaService,
  alterarEstoqueMassaService,
  alterarStatusMassaService,
  alterarTituloMassaService,
  alterarDescricaoMassaService,
  sincronizarSelecionadosMassaService
} from "../services/acoesMassa.service";

export async function listarAnunciosAcoesMassa(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const anuncios = await listarAnunciosAcoesMassaService(usuarioId);

    return res.json(anuncios);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao listar anúncios"
    });
  }
}

export async function reajustarPrecoMassa(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const resultado = await reajustarPrecoMassaService(usuarioId, req.body);

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao reajustar preço"
    });
  }
}

export async function alterarEstoqueMassa(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const resultado = await alterarEstoqueMassaService(usuarioId, req.body);

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao alterar estoque"
    });
  }
}

export async function pausarAnunciosMassa(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const resultado = await alterarStatusMassaService(
      usuarioId,
      req.body.anuncio_ids,
      "paused"
    );

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao pausar anúncios"
    });
  }
}

export async function ativarAnunciosMassa(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const resultado = await alterarStatusMassaService(
      usuarioId,
      req.body.anuncio_ids,
      "active"
    );

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao ativar anúncios"
    });
  }
}

export async function sincronizarAnunciosMassa(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const resultado = await sincronizarSelecionadosMassaService(
      usuarioId,
      req.body.anuncio_ids
    );

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao sincronizar anúncios"
    });
  }
}

export async function alterarTituloMassa(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const resultado = await alterarTituloMassaService(usuarioId, req.body);

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao alterar títulos"
    });
  }
}

export async function alterarDescricaoMassa(req: AuthRequest, res: Response) {
  try {
    const usuarioId = req.usuario?.id as number;
    const resultado = await alterarDescricaoMassaService(usuarioId, req.body);

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao alterar descrições"
    });
  }
}