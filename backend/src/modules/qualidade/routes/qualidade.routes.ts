import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  atualizarQualidadeAnuncios,
  obterResumoQualidade,
  listarAnunciosQualidade
} from "../controllers/qualidade.controller";

const router = Router();

router.use(authMiddleware);

router.post("/atualizar", atualizarQualidadeAnuncios);
router.get("/resumo", obterResumoQualidade);
router.get("/anuncios", listarAnunciosQualidade);

export default router;