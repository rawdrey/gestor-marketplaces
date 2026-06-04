import axios, { AxiosRequestConfig } from "axios";
import { pool } from "../../../database/connection";
import { obterAccessTokenValidoService } from "./mercadoLivre.service";

type Metodo = "GET" | "POST" | "PUT" | "DELETE";

async function registrarLog(
  usuarioId: number | null,
  contaId: number,
  metodo: Metodo,
  endpoint: string,
  statusCode: number | null,
  sucesso: boolean,
  erro?: string
) {
  await pool.query(
    `
    INSERT INTO mercado_livre_api_logs
    (
      usuario_id,
      conta_mercado_livre_id,
      metodo,
      endpoint,
      status_code,
      sucesso,
      erro
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    `,
    [
      usuarioId,
      contaId,
      metodo,
      endpoint,
      statusCode,
      sucesso,
      erro || null
    ]
  );
}

function aguardar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requisicaoMercadoLivre(
  usuarioId: number | null,
  contaId: number,
  metodo: Metodo,
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig,
  tentativa = 1
): Promise<any> {
  const accessToken = await obterAccessTokenValidoService(contaId);

  const url = endpoint.startsWith("http")
    ? endpoint
    : `https://api.mercadolibre.com${endpoint}`;

  try {
    const response = await axios({
      method: metodo,
      url,
      data,
      params: config?.params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(config?.headers || {})
      }
    });

    await registrarLog(
      usuarioId,
      contaId,
      metodo,
      endpoint,
      response.status,
      true
    );

    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    const mensagem =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Erro desconhecido Mercado Livre";

    const deveTentarNovamente =
      tentativa < 3 &&
      (
        status === 401 ||
        status === 429 ||
        status >= 500
      );

    if (deveTentarNovamente) {
      const espera = status === 429 ? 3000 : 1500;
      await aguardar(espera);

      return requisicaoMercadoLivre(
        usuarioId,
        contaId,
        metodo,
        endpoint,
        data,
        config,
        tentativa + 1
      );
    }

    await registrarLog(
      usuarioId,
      contaId,
      metodo,
      endpoint,
      status || null,
      false,
      mensagem
    );

    throw new Error(mensagem);
  }
}

export async function mercadoLivreGet(
  usuarioId: number | null,
  contaId: number,
  endpoint: string,
  config?: AxiosRequestConfig
) {
  return requisicaoMercadoLivre(
    usuarioId,
    contaId,
    "GET",
    endpoint,
    undefined,
    config
  );
}

export async function mercadoLivrePost(
  usuarioId: number | null,
  contaId: number,
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
) {
  return requisicaoMercadoLivre(
    usuarioId,
    contaId,
    "POST",
    endpoint,
    data,
    config
  );
}

export async function mercadoLivrePut(
  usuarioId: number | null,
  contaId: number,
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
) {
  return requisicaoMercadoLivre(
    usuarioId,
    contaId,
    "PUT",
    endpoint,
    data,
    config
  );
}

export async function mercadoLivreDelete(
  usuarioId: number | null,
  contaId: number,
  endpoint: string,
  config?: AxiosRequestConfig
) {
  return requisicaoMercadoLivre(
    usuarioId,
    contaId,
    "DELETE",
    endpoint,
    undefined,
    config
  );
}