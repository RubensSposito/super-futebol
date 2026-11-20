import type { Jogador, ResultadoDivisaoTimes, TimeFormado } from "@/types";
import { normalizarNomeJogador } from "@/lib/jogadores";

const REGEX_CABECALHO_TIME =
  /^\s*(?:time|equipe|grupo|colete)\s*([0-9a-zá-ú\s]+)?(?::|-)?\s*$/i;
const REGEX_CABECALHO_RESERVAS =
  /^\s*(?:reservas?|espera|próximos?|fora)(?::|-)?\s*$/i;

const REGEX_PREFIXO_NUMERACAO = /^\s*(?:\d+[\.\-\)]|\-|\*|\•)\s*/;
const REGEX_GOLEIRO_SUFIXO = /\s*(?:\(g\)|\[g\]|\(goleiro\)|\[goleiro\]|- goleiro)\s*$/i;

type TimeLido = {
  numero: number;
  rotulo?: string;
  jogadores: Jogador[];
};

export type ResultadoImportacaoTimes = {
  sucesso: boolean;
  resultado?: ResultadoDivisaoTimes;
  jogadoresNovos: Jogador[];
  mensagemErro?: string;
};

function extrairGoleiroENome(linhaBruta: string): { nome: string; ehGoleiro: boolean } {
  let linha = linhaBruta.replace(REGEX_PREFIXO_NUMERACAO, "").trim();
  let ehGoleiro = false;

  if (REGEX_GOLEIRO_SUFIXO.test(linha)) {
    ehGoleiro = true;
    linha = linha.replace(REGEX_GOLEIRO_SUFIXO, "").trim();
  } else if (/^goleiro\s*[:\-]\s*/i.test(linha)) {
    ehGoleiro = true;
    linha = linha.replace(/^goleiro\s*[:\-]\s*/i, "").trim();
  }

  const nomeNormalizado = normalizarNomeJogador(linha);
  return { nome: nomeNormalizado, ehGoleiro };
}

export function lerTimesSorteados(
  texto: string,
  jogadoresExistentes: readonly Jogador[],
): ResultadoImportacaoTimes {
  const linhas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (linhas.length === 0) {
    return { sucesso: false, jogadoresNovos: [], mensagemErro: "Cole o texto dos times sorteados." };
  }

  const mapaExistentes = new Map<string, Jogador>();
  for (const j of jogadoresExistentes) {
    mapaExistentes.set(normalizarNomeJogador(j.nome).toLowerCase(), j);
  }

  const timesLidos: TimeLido[] = [];
  const reservasLidas: Jogador[] = [];
  const jogadoresNovos: Jogador[] = [];

  let timeAtual: TimeLido | null = null;
  let emReservas = false;
  let contadorTimes = 0;
  let seedId = 1;

  for (const linha of linhas) {
    if (REGEX_CABECALHO_RESERVAS.test(linha)) {
      emReservas = true;
      timeAtual = null;
      continue;
    }

    const matchTime = linha.match(REGEX_CABECALHO_TIME);
    if (matchTime) {
      emReservas = false;
      contadorTimes += 1;
      timeAtual = {
        numero: contadorTimes,
        rotulo: matchTime[1]?.trim() || `Time ${contadorTimes}`,
        jogadores: [],
      };
      timesLidos.push(timeAtual);
      continue;
    }

    const { nome, ehGoleiro } = extrairGoleiroENome(linha);
    if (!nome || nome.length < 2) continue;

    const chave = nome.toLowerCase();
    let jogadorFinal = mapaExistentes.get(chave);

    if (!jogadorFinal) {
      jogadorFinal = {
        id: `importado_${Date.now()}_${seedId++}`,
        nome,
        tipo: ehGoleiro ? "goleiro" : "linha",
        posicao: ehGoleiro ? "goleiro" : undefined,
        vinculo: "avulso",
      };
      mapaExistentes.set(chave, jogadorFinal);
      jogadoresNovos.push(jogadorFinal);
    } else if (ehGoleiro && jogadorFinal.tipo !== "goleiro") {
      // Se na lista ele está marcado como goleiro, respeita para esta partida
      jogadorFinal = { ...jogadorFinal, tipo: "goleiro", posicao: "goleiro" };
    }

    if (emReservas) {
      reservasLidas.push(jogadorFinal);
    } else if (timeAtual) {
      timeAtual.jogadores.push(jogadorFinal);
    } else {
      // Se não havia cabeçalho explícito ainda, cria o primeiro time
      contadorTimes += 1;
      timeAtual = {
        numero: contadorTimes,
        rotulo: `Time ${contadorTimes}`,
        jogadores: [jogadorFinal],
      };
      timesLidos.push(timeAtual);
    }
  }

  if (timesLidos.length < 2) {
    return {
      sucesso: false,
      jogadoresNovos: [],
      mensagemErro:
        "Não foi possível identificar pelo menos 2 times. Separe os times com cabeçalhos como 'Time 1:' e 'Time 2:'.",
    };
  }

  const timesFormados: TimeFormado[] = timesLidos.map((tl) => {
    const goleiroIndex = tl.jogadores.findIndex((j) => j.tipo === "goleiro");
    let goleiro: Jogador | undefined;
    let jogadoresLinha: Jogador[] = [...tl.jogadores];

    if (goleiroIndex >= 0) {
      goleiro = tl.jogadores[goleiroIndex];
      jogadoresLinha.splice(goleiroIndex, 1);
    }

    return {
      numero: tl.numero,
      goleiro,
      jogadoresLinha,
      vagaExtraGoleiro: !goleiro,
    };
  });

  const todosJogadores = [
    ...timesFormados.flatMap((t) => [
      ...(t.goleiro ? [t.goleiro] : []),
      ...t.jogadoresLinha,
    ]),
    ...reservasLidas,
  ];

  const tamanhos = timesFormados.map(
    (t) => t.jogadoresLinha.length + (t.goleiro ? 1 : 0),
  );
  const tamanhoMedio = Math.round(
    tamanhos.reduce((a, b) => a + b, 0) / timesFormados.length,
  );

  const resultado: ResultadoDivisaoTimes = {
    times: timesFormados,
    reservas: reservasLidas,
    N: timesFormados.length,
    T: tamanhoMedio,
    R: reservasLidas.length,
    totais: {
      jogadores: todosJogadores.length,
      goleiros: todosJogadores.filter((j) => j.tipo === "goleiro").length,
      jogadoresLinha: todosJogadores.filter((j) => j.tipo !== "goleiro").length,
      reservas: reservasLidas.length,
    },
    motivo: null,
    divisaoIgual: true,
  };

  return {
    sucesso: true,
    resultado,
    jogadoresNovos,
  };
}
