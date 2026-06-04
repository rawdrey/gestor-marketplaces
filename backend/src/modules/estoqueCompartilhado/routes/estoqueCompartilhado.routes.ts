import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  listarEstoqueCompartilhado,
  sincronizarSkuCompartilhado
} from "../controllers/estoqueCompartilhado.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", listarEstoqueCompartilhado);
router.post("/:produtoId/sincronizar", sincronizarSkuCompartilhado);

export default router;