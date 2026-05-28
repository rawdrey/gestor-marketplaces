import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  registrarEntradaEstoque,
  listarEntradasEstoque
} from "../controllers/entradasEstoque.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", registrarEntradaEstoque);
router.get("/", listarEntradasEstoque);

export default router;