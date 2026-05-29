import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  criarAnuncio,
  listarAnuncios,
  atualizarAnuncio,
  desativarAnuncio,
  clonarAnuncio,
  buscarAnuncioParaClonar
} from "../controllers/anuncios.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", listarAnuncios);
router.get("/buscar-para-clonar", buscarAnuncioParaClonar);
router.post("/", criarAnuncio);
router.post("/:id/clonar", clonarAnuncio);
router.put("/:id", atualizarAnuncio);
router.delete("/:id", desativarAnuncio);

export default router;