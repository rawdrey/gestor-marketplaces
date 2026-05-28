import { Router } from "express";
import { registrarUsuario, login } from "../controllers/auth.controller";

const router = Router();

router.post("/registrar", registrarUsuario);
router.post("/login", login);

export default router;