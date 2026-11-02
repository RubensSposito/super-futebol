import type { Jogador, NovoJogador, ResultadoLeituraLista, Vinculo } from "@/types";
import {
  normalizarNomeJogador,
  validarNovoJogador,
} from "@/lib/jogadores";

type Secao = "goleiros" | "jogadores" | null;

export function lerListaJogadores(
  texto: string,
  jogadoresExistentes: readonly Jogador[] = [],
  vinculo?: Vinculo,
): ResultadoLeituraLista {
  const resultado: ResultadoLeituraLista = {
    goleiros: [],
    jogadores: [],
    ordem: [],
    repetidos: 0,
    linhasIgnoradas: 0,
  };
  let secao: Secao = null;

  for (const linha of texto.split(/\r?\n/)) {
    const conteudo = linha.trim();
    const cabecalho = conteudo.toLowerCase();

    if (cabecalho === "goleiros:" || cabecalho === "goleiro:") {
      secao = "goleiros";
      continue;
    }
    if (cabecalho === "jogadores:" || cabecalho === "jogador:") {
      secao = "jogadores";
      continue;
    }

    const item = /^[-–•*](.*)$/.exec(conteudo);
    if (!secao || !item) {
      resultado.linhasIgnoradas += 1;
      continue;
    }

    const nome = normalizarNomeJogador(item[1]);
    if (!nome) {
      continue;
    }

    const jogador: NovoJogador = {
      nome,
      tipo: secao === "goleiros" ? "goleiro" : "linha",
      ...(secao === "goleiros" ? { posicao: "goleiro" as const } : {}),
      ...(vinculo ? { vinculo } : {}),
    };
    const validacao = validarNovoJogador(jogador, [
      ...jogadoresExistentes,
      ...resultado.ordem,
    ]);
    if (!validacao.valido) {
      resultado.repetidos += 1;
      continue;
    }

    const jogadorNormalizado: NovoJogador = {
      ...jogador,
      nome: validacao.nome,
    };
    resultado.ordem.push(jogadorNormalizado);
    resultado[secao].push(jogadorNormalizado);
  }

  return resultado;
}
