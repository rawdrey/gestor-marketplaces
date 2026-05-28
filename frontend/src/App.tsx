import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Produtos } from "./pages/Produtos";
import { EntradasEstoque } from "./pages/EntradasEstoque";
import { Anuncios } from "./pages/Anuncios";
import { Vendas } from "./pages/Vendas";

function RotaPrivada() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  return <Layout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RotaPrivada />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/entradas-estoque" element={<EntradasEstoque />} />
          <Route path="/anuncios" element={<Anuncios />} />
          <Route path="/vendas" element={<Vendas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}