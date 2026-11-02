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

function parametrosJogador(jogador: NovoJogador) {
  return [
    normalizarNomeJogador(jogador.nome),
    nomeNormalizado(jogador.nome),
    jogador.tipo,
    jogador.posicao ?? null,
    jogador.nivel ?? null,
    jogador.vinculo ?? null,
    obterDataLocal(),
  ] as const;
}

export function listarJogadores(): Promise<ResultadoBanco<Jogador[]>> {
  return executarComResultado("Listar jogadores", ERRO_LISTAR, async () => {
    const db = await getDb();
    const linhas = await db.getAllAsync<LinhaJogador>(
      "SELECT id, nome, tipo, posicao, nivel, vinculo FROM jogadores ORDER BY id ASC",
    );
    return linhas.map(mapearJogador);
  });
}

export function adicionarJogadorBanco(
  jogador: NovoJogador,
): Promise<ResultadoBanco<ResultadoAdicaoJogadorBanco>> {
  return executarComResultado("Adicionar jogador", ERRO_SALVAR, async () => {
    const db = await getDb();
    const existentes = await db.getAllAsync<{ nome: string }>(
      "SELECT nome FROM jogadores",
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
        (nome, nome_normalizado, tipo, posicao, nivel, vinculo, data_criacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ...parametrosJogador(jogadorValidado),
    );
    if (result.changes === 0) {
      return {
        jogador: null,
        duplicado: true,
        motivo: "nome_duplicado",
      };
    }
    const salvo = await db.getFirstAsync<LinhaJogador>(
      "SELECT id, nome, tipo, posicao, nivel, vinculo FROM jogadores WHERE id = ?",
      result.lastInsertRowId,
    );
    if (!salvo) throw new Error("Jogador inserido não foi encontrado.");
    return { jogador: mapearJogador(salvo), duplicado: false };
  });
}

export function atualizarJogadorBanco(
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
      >("SELECT CAST(id AS TEXT) AS id, nome FROM jogadores");
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
         WHERE id = ?`,
        validacao.nome,
        nomeNormalizado(validacao.nome),
        jogador.tipo,
        jogador.tipo === "goleiro" ? "goleiro" : jogador.posicao ?? null,
        jogador.nivel ?? null,
        jogador.vinculo ?? null,
        jogadorId,
      );
      if (result.changes === 0) {
        return {
          jogador: null,
          duplicado: false,
          motivo: "jogador_nao_encontrado",
        };
      }
      const salvo = await db.getFirstAsync<LinhaJogador>(
        "SELECT id, nome, tipo, posicao, nivel, vinculo FROM jogadores WHERE id = ?",
        jogadorId,
      );
      if (!salvo) throw new Error("Jogador atualizado não foi encontrado.");
      return { jogador: mapearJogador(salvo), duplicado: false };
    },
  );
}

export function adicionarJogadoresBanco(
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
          "SELECT nome FROM jogadores",
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
              (nome, nome_normalizado, tipo, posicao, nivel, vinculo, data_criacao)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ...parametrosJogador(jogadorValidado),
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
