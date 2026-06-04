import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  gerarUrlAutorizacao,
  callbackMercadoLivre,
  listarContasMercadoLivre,
  definirContaPadrao,
  desativarContaMercadoLivre,
  buscarAnuncioMercadoLivreParaClonar,
  clonarAnuncioMercadoLivreReal,
  importarVendasMercadoLivre
} from "../controllers/mercadoLivre.controller";

const router = Router();

router.get("/callback", authMiddleware, callbackMercadoLivre);

router.use(authMiddleware);

router.get("/auth-url", gerarUrlAutorizacao);
router.get("/contas", listarContasMercadoLivre);
router.put("/contas/:id/padrao", definirContaPadrao);
router.delete("/contas/:id", desativarContaMercadoLivre);
router.post("/importar-vendas", importarVendasMercadoLivre);
router.get("/clonar/buscar", buscarAnuncioMercadoLivreParaClonar);
router.post("/clonar/publicar", clonarAnuncioMercadoLivreReal);

export default router;