import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

import {
  listarAnunciosAcoesMassa,
  reajustarPrecoMassa,
  alterarEstoqueMassa,
  alterarTituloMassa,
  alterarDescricaoMassa,
  pausarAnunciosMassa,
  ativarAnunciosMassa,
  sincronizarAnunciosMassa
} from "../controllers/acoesMassa.controller";

const router = Router();

router.use(authMiddleware);

router.get("/anuncios", listarAnunciosAcoesMassa);
router.post("/preco", reajustarPrecoMassa);
router.post("/estoque", alterarEstoqueMassa);
router.post("/pausar", pausarAnunciosMassa);
router.post("/ativar", ativarAnunciosMassa);
router.post("/titulo", alterarTituloMassa);
router.post("/descricao", alterarDescricaoMassa);
router.post("/sincronizar", sincronizarAnunciosMassa);

export default router;