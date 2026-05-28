import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  criarAnuncio,
  listarAnuncios,
  atualizarAnuncio,
  desativarAnuncio,
  clonarAnuncio
} from "../controllers/anuncios.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", criarAnuncio);
router.get("/", listarAnuncios);
router.put("/:id", atualizarAnuncio);
router.delete("/:id", desativarAnuncio);
router.post("/:id/clonar", clonarAnuncio);

export default router;