import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  obterConfiguracoes,
  atualizarConfiguracoes
} from "../controllers/configuracoes.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", obterConfiguracoes);
router.put("/", atualizarConfiguracoes);

export default router;