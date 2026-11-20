import type { ResultadoBanco } from "@/types";
import { getDb } from "./conexao";
import { executarComResultado } from "./resultadoBanco";

type LinhaPresenca = {
  jogador_id: number;
  presente: number;
};

export function obterPresencas(
  futebolId: number,
  data: string,
): Promise<ResultadoBanco<Record<string, boolean>>> {
  return executarComResultado(
    "Carregar presenças",
    "Não foi possível carregar as presenças.",
    async () => {
      const db = await getDb();
      const linhas = await db.getAllAsync<LinhaPresenca>(
        `SELECT p.jogador_id, p.presente FROM presencas p
         JOIN jogadores j ON j.id = p.jogador_id
         WHERE j.futebol_id = ? AND p.data = ?`,
        futebolId,
        data,
      );
      return Object.fromEntries(
        linhas.map((linha) => [String(linha.jogador_id), linha.presente === 1]),
      );
    },
  );
}

export function definirPresenca(
  futebolId: number,
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
         SELECT id, ?, ? FROM jogadores WHERE id = ? AND futebol_id = ?
         ON CONFLICT(jogador_id, data)
         DO UPDATE SET presente = excluded.presente`,
        data,
        presente ? 1 : 0,
        Number(jogadorId),
        futebolId,
      );
    },
  );
}
