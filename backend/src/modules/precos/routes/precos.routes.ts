import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  listarAnunciosPrecos,
  reajustarPrecos,
  aplicarPrecoInteligente
} from "../controllers/precos.controller";

const router = Router();

router.use(authMiddleware);

router.get("/anuncios", listarAnunciosPrecos);
router.post("/reajustar", reajustarPrecos);
router.post("/inteligente", aplicarPrecoInteligente);

export default router;