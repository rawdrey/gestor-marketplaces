import { Router } from "express";
import { authMiddleware } from "../shared/middlewares/auth.middleware";

import {
  criarProduto,
  listarProdutos,
  atualizarProduto,
  desativarProduto
} from "../controllers/produtos.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", criarProduto);
router.get("/", listarProdutos);
router.put("/:id", atualizarProduto);
router.delete("/:id", desativarProduto);

export default router;