import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3001"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const contaMercadoLivreId = localStorage.getItem("conta_mercado_livre_id");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (contaMercadoLivreId) {
    config.headers["x-conta-mercado-livre-id"] = contaMercadoLivreId;
  }

  return config;
});