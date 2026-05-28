import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import produtosRoutes from "./routes/produtos.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.json({
    mensagem: "API Gestor Marketplaces funcionando"
  });
});

app.use("/produtos", produtosRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});