import type {
  Jogador,
  NovoJogador,
  ResultadoAdicionarLista,
  ResultadoAdicaoJogadorBanco,
  ResultadoBanco,
} from "@/types";
import {
  normalizarNomeJogador,
  validarNovoJogador,
} from "@/lib/jogadores";
import { obterDataLocal } from "@/lib/datas";
import { getDb } from "./conexao";
import { mapearJogador, type LinhaJogador } from "./mapeadores";
import { executarComResultado } from "./resultadoBanco";

const ERRO_LISTAR = "Não foi possível carregar os jogadores.";
const ERRO_SALVAR = "Não foi possível salvar o jogador.";

function nomeNormalizado(nome: string): string {
  return normalizarNomeJogador(nome).toLowerCase();
}

function parametrosJogador(futebolId: number, jogador: NovoJogador) {
  return [
    futebolId,
    normalizarNomeJogador(jogador.nome),
    nomeNormalizado(jogador.nome),
    jogador.tipo,
    jogador.posicao ?? null,
    jogador.nivel ?? null,
    jogador.vinculo ?? null,
    obterDataLocal(),
  ] as const;
}

export function listarJogadores(futebolId: number): Promise<ResultadoBanco<Jogador[]>> {
  return executarComResultado("Listar jogadores", ERRO_LISTAR, async () => {
    const db = await getDb();
    const linhas = await db.getAllAsync<LinhaJogador>(
      "SELECT id, nome, tipo, posicao, nivel, vinculo FROM jogadores WHERE futebol_id = ? ORDER BY id ASC",
      futebolId,
    );
    return linhas.map(mapearJogador);
  });
}

export function adicionarJogadorBanco(
  futebolId: number,
  jogador: NovoJogador,
): Promise<ResultadoBanco<ResultadoAdicaoJogadorBanco>> {
  return executarComResultado("Adicionar jogador", ERRO_SALVAR, async () => {
    const db = await getDb();
    const existentes = await db.getAllAsync<{ nome: string }>(
      "SELECT nome FROM jogadores WHERE futebol_id = ?",
      futebolId,
    );
    const validacao = validarNovoJogador(jogador, existentes);
    if (!validacao.valido) {
      return {
        jogador: null,
        duplicado: validacao.motivo === "nome_duplicado",
        motivo: validacao.motivo,
      };
    }
    const jogadorValidado = { ...jogador, nome: validacao.nome };
    const result = await db.runAsync(
      `INSERT OR IGNORE INTO jogadores
        (futebol_id, nome, nome_normalizado, tipo, posicao, nivel, vinculo, data_criacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ...parametrosJogador(futebolId, jogadorValidado),
    );
    if (result.changes === 0) {
      return {
        jogador: null,
        duplicado: true,
        motivo: "nome_duplicado",
      };
    }
    const salvo = await db.getFirstAsync<LinhaJogador>(
      "SELECT id, nome, tipo, posicao, nivel, vinculo FROM jogadores WHERE id = ? AND futebol_id = ?",
      result.lastInsertRowId,
      futebolId,
    );
    if (!salvo) throw new Error("Jogador inserido não foi encontrado.");
    return { jogador: mapearJogador(salvo), duplicado: false };
  });
}

export function atualizarJogadorBanco(
  futebolId: number,
  id: string,
  jogador: NovoJogador,
): Promise<ResultadoBanco<ResultadoAdicaoJogadorBanco>> {
  return executarComResultado(
    "Atualizar jogador",
    "Não foi possível salvar as alterações do jogador.",
    async () => {
      const jogadorId = Number(id);
      if (!Number.isSafeInteger(jogadorId) || jogadorId < 1) {
        throw new RangeError("Identificador de jogador inválido.");
      }
      const db = await getDb();
      const existentes = await db.getAllAsync<
        Pick<Jogador, "id" | "nome">
      >("SELECT CAST(id AS TEXT) AS id, nome FROM jogadores WHERE futebol_id = ?", futebolId);
      const validacao = validarNovoJogador(jogador, existentes, id);
      if (!validacao.valido) {
        return {
          jogador: null,
          duplicado: validacao.motivo === "nome_duplicado",
          motivo: validacao.motivo,
        };
      }
      const result = await db.runAsync(
        `UPDATE jogadores
         SET nome = ?, nome_normalizado = ?, tipo = ?, posicao = ?,
             nivel = ?, vinculo = ?
         WHERE id = ? AND futebol_id = ?`,
        validacao.nome,
        nomeNormalizado(validacao.nome),
        jogador.tipo,
        jogador.tipo === "goleiro" ? "goleiro" : jogador.posicao ?? null,
        jogador.nivel ?? null,
        jogador.vinculo ?? null,
        jogadorId,
        futebolId,
      );
      if (result.changes === 0) {
        return {
          jogador: null,
          duplicado: false,
          motivo: "jogador_nao_encontrado",
        };
      }
      const salvo = await db.getFirstAsync<LinhaJogador>(
        "SELECT id, nome, tipo, posicao, nivel, vinculo FROM jogadores WHERE id = ? AND futebol_id = ?",
        jogadorId,
        futebolId,
      );
      if (!salvo) throw new Error("Jogador atualizado não foi encontrado.");
      return { jogador: mapearJogador(salvo), duplicado: false };
    },
  );
}

export function adicionarJogadoresBanco(
  futebolId: number,
  jogadores: readonly NovoJogador[],
): Promise<ResultadoBanco<ResultadoAdicionarLista>> {
  return executarComResultado(
    "Adicionar jogadores em lote",
    "Não foi possível salvar a lista de jogadores.",
    async () => {
      const db = await getDb();
      let goleirosAdicionados = 0;
      let jogadoresAdicionados = 0;
      let ignorados = 0;
      await db.withTransactionAsync(async () => {
        const existentes = await db.getAllAsync<{ nome: string }>(
          "SELECT nome FROM jogadores WHERE futebol_id = ?",
          futebolId,
        );
        const nomesConhecidos = existentes.map((jogador) => ({
          nome: jogador.nome,
        }));
        for (const jogador of jogadores) {
          const validacao = validarNovoJogador(jogador, nomesConhecidos);
          if (!validacao.valido) {
            ignorados += 1;
            continue;
          }
          const jogadorValidado = { ...jogador, nome: validacao.nome };
          const result = await db.runAsync(
            `INSERT OR IGNORE INTO jogadores
              (futebol_id, nome, nome_normalizado, tipo, posicao, nivel, vinculo, data_criacao)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ...parametrosJogador(futebolId, jogadorValidado),
          );
          if (result.changes === 0) {
            ignorados += 1;
          } else if (jogador.tipo === "goleiro") {
            goleirosAdicionados += 1;
          } else {
            jogadoresAdicionados += 1;
            nomesConhecidos.push({ nome: validacao.nome });
          }
          if (result.changes > 0 && jogador.tipo === "goleiro") {
            nomesConhecidos.push({ nome: validacao.nome });
          }
        }
      });
      return {
        goleirosAdicionados,
        jogadoresAdicionados,
        repetidos: ignorados,
      };
    },
  );
}

export function excluirJogadorBanco(
  futebolId: number,
  id: string,
): Promise<ResultadoBanco<void>> {
  return executarComResultado(
    "Excluir jogador",
    "Não foi possível excluir o jogador.",
    async () => {
      const jogadorId = Number(id);
      if (!Number.isSafeInteger(jogadorId) || jogadorId < 1) {
        throw new RangeError("Identificador de jogador inválido.");
      }
      const db = await getDb();
      await db.withTransactionAsync(async () => {
        await db.runAsync("DELETE FROM presencas WHERE jogador_id = ?", jogadorId);
        await db.runAsync(
          "DELETE FROM pagamentos_mensalidade WHERE jogador_id = ?",
          jogadorId,
        );
        await db.runAsync(
          "DELETE FROM pagamentos_avulso WHERE jogador_id = ?",
          jogadorId,
        );
        const result = await db.runAsync(
          "DELETE FROM jogadores WHERE id = ? AND futebol_id = ?",
          jogadorId,
          futebolId,
        );
        if (result.changes === 0) {
          throw new Error("Jogador não encontrado para exclusão.");
        }
      });
    },
  );
}

