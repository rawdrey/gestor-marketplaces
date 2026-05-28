import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  registrarVenda,
  listarVendas
} from "../controllers/vendas.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", registrarVenda);
router.get("/", listarVendas);

export default router;