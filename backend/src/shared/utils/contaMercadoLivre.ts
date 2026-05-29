import { AuthRequest } from "../middlewares/auth.middleware";

export function obterContaMercadoLivreId(req: AuthRequest): number | null {
  const valor = req.headers["x-conta-mercado-livre-id"];

  if (!valor) return null;

  const contaId = Number(valor);

  if (!Number.isFinite(contaId)) return null;

  return contaId;
}