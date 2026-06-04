import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  listarAnunciosPrecos,
  reajustarPrecos
} from "../controllers/precos.controller";

const router = Router();

router.use(authMiddleware);

router.get("/anuncios", listarAnunciosPrecos);
router.post("/reajustar", reajustarPrecos);

export default router;