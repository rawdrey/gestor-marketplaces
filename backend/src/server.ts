import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import produtosRoutes from "./routes/produtos.routes";
import mercadoLivreRoutes from "./modules/mercadoLivre/routes/mercadoLivre.routes";
import authRoutes from "./modules/auth/routes/auth.routes";
import anunciosRoutes from "./modules/anuncios/routes/anuncios.routes";
import acoesMassaRoutes from "./modules/acoesMassa/routes/acoesMassa.routes";
import qualidadeRoutes from "./modules/qualidade/routes/qualidade.routes";
import vendasRoutes from "./modules/vendas/routes/vendas.routes";
import entradasEstoqueRoutes from "./modules/entradasEstoque/routes/entradasEstoque.routes";
import dashboardRoutes from "./modules/dashboard/routes/dashboard.routes";
import precosRoutes from "./modules/precos/routes/precos.routes";
import sincronizacaoRoutes from "./modules/sincronizacao/routes/sincronizacao.routes";
import estoqueCompartilhadoRoutes from "./modules/estoqueCompartilhado/routes/estoqueCompartilhado.routes";
import configuracoesRoutes from "./modules/configuracoes/routes/configuracoes.routes";

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
app.use("/mercado-livre", mercadoLivreRoutes);
app.use("/anuncios", anunciosRoutes);
app.use("/acoes-massa", acoesMassaRoutes);
app.use("/qualidade", qualidadeRoutes);
app.use("/precos", precosRoutes);
app.use("/sincronizacao", sincronizacaoRoutes);
app.use("/estoque-compartilhado", estoqueCompartilhadoRoutes);
app.use("/vendas", vendasRoutes);
app.use("/entradas-estoque", entradasEstoqueRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/configuracoes", configuracoesRoutes);


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});