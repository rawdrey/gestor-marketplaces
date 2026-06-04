import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  criarAnuncio,
  listarAnuncios,
  atualizarAnuncio,
  desativarAnuncio,
  clonarAnuncio,
  listarAnunciosPendentesSku,
  vincularSkuAutomaticamente,
  buscarAnuncioParaClonar,
  vincularSkuAnuncio
} from "../controllers/anuncios.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", listarAnuncios);
router.get("/buscar-para-clonar", buscarAnuncioParaClonar);
router.get("/pendentes-sku", listarAnunciosPendentesSku);
router.post("/vincular-automaticamente", vincularSkuAutomaticamente);
router.post("/", criarAnuncio);
router.post("/:id/clonar", clonarAnuncio);
router.put("/:id/vincular-sku", vincularSkuAnuncio);
router.put("/:id", atualizarAnuncio);
router.delete("/:id", desativarAnuncio);

export default router;