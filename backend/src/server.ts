import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import produtosRoutes from "./routes/produtos.routes";
import authRoutes from "./modules/auth/routes/auth.routes";
import anunciosRoutes from "./modules/anuncios/routes/anuncios.routes";
import vendasRoutes from "./modules/vendas/routes/vendas.routes";
import entradasEstoqueRoutes from "./modules/entradasEstoque/routes/entradasEstoque.routes";
import dashboardRoutes from "./modules/dashboard/routes/dashboard.routes";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.json({
    mensagem: "API Gestor Marketplaces funcionando"
  });
});

app.use("/auth", authRoutes);
app.use("/produtos", produtosRoutes);
app.use("/anuncios", anunciosRoutes);
app.use("/vendas", vendasRoutes);
app.use("/entradas-estoque", entradasEstoqueRoutes);
app.use("/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});