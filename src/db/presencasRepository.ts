import type { ResultadoBanco } from "@/types";
import { getDb } from "./conexao";
import { executarComResultado } from "./resultadoBanco";

type LinhaPresenca = {
  jogador_id: number;
  presente: number;
};

export function obterPresencas(
  data: string,
): Promise<ResultadoBanco<Record<string, boolean>>> {
  return executarComResultado(
    "Carregar presenças",
    "Não foi possível carregar as presenças.",
    async () => {
      const db = await getDb();
      const linhas = await db.getAllAsync<LinhaPresenca>(
        "SELECT jogador_id, presente FROM presencas WHERE data = ?",
        data,
      );
      return Object.fromEntries(
        linhas.map((linha) => [String(linha.jogador_id), linha.presente === 1]),
      );
    },
  );
}

export function definirPresenca(
  jogadorId: string,
  data: string,
  presente: boolean,
): Promise<ResultadoBanco<void>> {
  return executarComResultado(
    "Salvar presença",
    "Não foi possível salvar a presença.",
    async () => {
      const db = await getDb();
      await db.runAsync(
        `INSERT INTO presencas (jogador_id, data, presente)
         VALUES (?, ?, ?)
         ON CONFLICT(jogador_id, data)
         DO UPDATE SET presente = excluded.presente`,
        Number(jogadorId),
        data,
        presente ? 1 : 0,
      );
    },
  );
}
