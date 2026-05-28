import { Request, Response } from "express";
import {
  registrarUsuarioService,
  loginService
} from "../services/auth.service";

export async function registrarUsuario(req: Request, res: Response) {
  try {
    const usuario = await registrarUsuarioService(req.body);

    return res.status(201).json({
      mensagem: "Usuário criado com sucesso",
      usuario
    });
  } catch (error: any) {
    return res.status(400).json({
      mensagem: error.message || "Erro ao criar usuário"
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const resultado = await loginService(req.body);

    return res.json(resultado);
  } catch (error: any) {
    return res.status(401).json({
      mensagem: error.message || "Erro ao fazer login"
    });
  }
}