import { Router } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { obterResumoDashboard } from "../controllers/dashboard.controller";

const router = Router();

router.use(authMiddleware);

router.get("/resumo", obterResumoDashboard);

export default router;