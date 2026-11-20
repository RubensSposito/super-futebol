import type { ResultadoBanco, ResultadoDivisaoTimes } from "@/types";
import { obterDataLocal } from "@/lib/datas";
import { getDb } from "./conexao";
import { executarComResultado } from "./resultadoBanco";

type LinhaSorteio = {
  id: number;
  futebol_id: number;
  data_jogo: string;
  dados_json: string;
  criado_em: string;
  atualizado_em: string;
};

export function obterSorteioSalvoBanco(
  futebolId: number,
  dataJogo: string,
): Promise<ResultadoBanco<ResultadoDivisaoTimes | null>> {
  return executarComResultado(
    "Carregar sorteio salvo",
    "Não foi possível carregar o sorteio salvo.",
    async () => {
      const db = await getDb();
      const linha = await db.getFirstAsync<LinhaSorteio>(
        "SELECT dados_json FROM sorteios WHERE futebol_id = ? AND data_jogo = ?",
        futebolId,
        dataJogo,
      );
      if (!linha) return null;
      try {
        const parsed = JSON.parse(linha.dados_json) as ResultadoDivisaoTimes;
        return parsed;
      } catch (e) {
        console.warn("Erro ao fazer parse dos times sorteados salvos:", e);
        return null;
      }
    },
  );
}

export function salvarSorteioBanco(
  futebolId: number,
  dataJogo: string,
  resultado: ResultadoDivisaoTimes,
): Promise<ResultadoBanco<void>> {
  return executarComResultado(
    "Salvar sorteio",
    "Não foi possível salvar o sorteio da partida.",
    async () => {
      const db = await getDb();
      const hoje = obterDataLocal();
      const json = JSON.stringify(resultado);
      await db.runAsync(
        `INSERT INTO sorteios (futebol_id, data_jogo, dados_json, criado_em, atualizado_em)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(futebol_id, data_jogo) DO UPDATE SET
           dados_json = excluded.dados_json,
           atualizado_em = excluded.atualizado_em`,
        futebolId,
        dataJogo,
        json,
        hoje,
        hoje,
      );
    },
  );
}

export function excluirSorteioBanco(
  futebolId: number,
  dataJogo: string,
): Promise<ResultadoBanco<void>> {
  return executarComResultado(
    "Excluir sorteio",
    "Não foi possível excluir o sorteio.",
    async () => {
      const db = await getDb();
      await db.runAsync(
        "DELETE FROM sorteios WHERE futebol_id = ? AND data_jogo = ?",
        futebolId,
        dataJogo,
      );
    },
  );
}
