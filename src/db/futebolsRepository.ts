import type { FutebolLista, ResultadoBanco } from "@/types";
import { getDb } from "./conexao";
import { executarComResultado } from "./resultadoBanco";

type LinhaFutebolLista = {
  id: number;
  nome: string;
  tipo_cadastro: FutebolLista["tipoCadastro"];
  dias_semana: string | null;
  frequencia: FutebolLista["frequencia"];
  horario: string | null;
  quantidade_jogadores_cadastrados: number;
};

export function listarFutebols(): Promise<ResultadoBanco<FutebolLista[]>> {
  return executarComResultado("Listar futebols", "Não foi possível carregar seus futebols.", async () => {
    const db = await getDb();
    const linhas = await db.getAllAsync<LinhaFutebolLista>(
      `SELECT f.id, f.nome, f.tipo_cadastro, f.dias_semana, f.frequencia, f.horario,
        COUNT(j.id) AS quantidade_jogadores_cadastrados
       FROM futebol f
       LEFT JOIN jogadores j ON j.futebol_id = f.id
       GROUP BY f.id
       ORDER BY f.ultimo_aberto_em DESC, f.id DESC`,
    );
    return linhas.map((linha) => ({
      id: linha.id,
      nome: linha.nome,
      tipoCadastro: linha.tipo_cadastro,
      diasSemana: linha.dias_semana ? linha.dias_semana.split(",").map(Number) : [],
      frequencia: linha.frequencia,
      horario: linha.horario,
      quantidadeJogadoresCadastrados: linha.quantidade_jogadores_cadastrados,
    }));
  });
}

export function abrirFutebol(futebolId: number): Promise<ResultadoBanco<void>> {
  return executarComResultado("Abrir futebol", "Não foi possível abrir esse futebol.", async () => {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const resultado = await db.runAsync(
        "UPDATE futebol SET ultimo_aberto_em = ? WHERE id = ?",
        Date.now(),
        futebolId,
      );
      if (resultado.changes === 0) throw new Error("O futebol selecionado não existe.");
      await db.runAsync(
        "INSERT INTO app_config (key, value) VALUES ('active_futebol_id', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        String(futebolId),
      );
    });
  });
}

export type ResultadoExclusaoFutebol = {
  nome: string;
  quantidadeJogadores: number;
  eraAtivo: boolean;
};

export function excluirFutebol(futebolId: number): Promise<ResultadoBanco<ResultadoExclusaoFutebol>> {
  return executarComResultado("Excluir futebol", "Não foi possível excluir esse futebol.", async () => {
    const db = await getDb();
    let resultadoExclusao: ResultadoExclusaoFutebol | null = null;
    await db.withTransactionAsync(async () => {
      const futebol = await db.getFirstAsync<{ nome: string }>(
        "SELECT nome FROM futebol WHERE id = ?",
        futebolId,
      );
      if (!futebol) throw new Error("O futebol selecionado não existe.");
      const jogadores = await db.getFirstAsync<{ total: number }>(
        "SELECT COUNT(*) AS total FROM jogadores WHERE futebol_id = ?",
        futebolId,
      );
      const ativo = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM app_config WHERE key = 'active_futebol_id'",
      );
      await db.runAsync("DELETE FROM futebol WHERE id = ?", futebolId);
      const eraAtivo = ativo?.value === String(futebolId);
      if (eraAtivo) await db.runAsync("DELETE FROM app_config WHERE key = 'active_futebol_id'");
      resultadoExclusao = {
        nome: futebol.nome,
        quantidadeJogadores: jogadores?.total ?? 0,
        eraAtivo,
      };
    });
    if (!resultadoExclusao) throw new Error("A exclusão não foi concluída.");
    return resultadoExclusao;
  });
}
