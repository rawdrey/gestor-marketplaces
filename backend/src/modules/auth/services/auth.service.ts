import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../../database/connection";

interface RegistrarUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
}

interface LoginDTO {
  email: string;
  senha: string;
}

export async function registrarUsuarioService(data: RegistrarUsuarioDTO) {
  const { nome, email, senha } = data;

  const usuarioExistente = await pool.query(
    "SELECT id FROM usuarios WHERE email = $1",
    [email]
  );

  if (usuarioExistente.rows.length > 0) {
    throw new Error("E-mail já cadastrado");
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const resultado = await pool.query(
    `
    INSERT INTO usuarios (nome, email, senha_hash)
    VALUES ($1, $2, $3)
    RETURNING id, nome, email, plano, ativo, criado_em
    `,
    [nome, email, senhaHash]
  );

  return resultado.rows[0];
}

export async function loginService(data: LoginDTO) {
  const { email, senha } = data;

  const resultado = await pool.query(
    "SELECT * FROM usuarios WHERE email = $1 AND ativo = TRUE",
    [email]
  );

  if (resultado.rows.length === 0) {
    throw new Error("E-mail ou senha inválidos");
  }

  const usuario = resultado.rows[0];

  const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);

  if (!senhaConfere) {
    throw new Error("E-mail ou senha inválidos");
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      plano: usuario.plano
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );

  return {
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      plano: usuario.plano
    },
    token
  };
}