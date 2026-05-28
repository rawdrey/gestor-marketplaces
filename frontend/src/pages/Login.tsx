import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("rawdrey@gmail.com");
  const [senha, setSenha] = useState("123456");
  const [erro, setErro] = useState("");

  async function entrar(event: FormEvent) {
    event.preventDefault();
    setErro("");

    try {
      const response = await api.post("/auth/login", {
        email,
        senha
      });

      localStorage.setItem("token", response.data.token);
      navigate("/");
    } catch {
      setErro("E-mail ou senha inválidos");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={entrar}
        className="bg-white w-full max-w-md p-6 rounded-2xl shadow"
      >
        <h1 className="text-2xl font-bold mb-2">Entrar</h1>
        <p className="text-gray-600 mb-6">
          Acesse seu painel de estoque e anúncios.
        </p>

        {erro && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {erro}
          </div>
        )}

        <label className="block mb-4">
          <span className="block mb-1 font-medium">E-mail</span>
          <input
            className="w-full border rounded-lg p-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </label>

        <label className="block mb-6">
          <span className="block mb-1 font-medium">Senha</span>
          <input
            className="w-full border rounded-lg p-3"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            type="password"
          />
        </label>

        <button className="w-full bg-blue-700 text-white p-3 rounded-lg font-bold">
          Entrar
        </button>
      </form>
    </div>
  );
}