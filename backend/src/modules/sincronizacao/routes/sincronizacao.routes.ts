import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  listarFilaSincronizacao,
  reenviarSincronizacao
} from "../controllers/sincronizacao.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", listarFilaSincronizacao);
router.put("/:id/reenviar", reenviarSincronizacao);

export default router;