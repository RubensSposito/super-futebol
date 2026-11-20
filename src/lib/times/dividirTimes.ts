import type { Jogador, Nivel, ResultadoDivisaoTimes, TimeFormado } from "@/types";

const PONTOS_NIVEL: Record<Nivel, number> = {
  iniciante: 1,
  amador: 2,
  semi_profissional: 3,
  profissional: 4,
};

function embaralhar<T>(itens: readonly T[], aleatorio: () => number): T[] {
  const resultado = [...itens];
  for (let indice = resultado.length - 1; indice > 0; indice -= 1) {
    const sorteado = Math.floor(aleatorio() * (indice + 1));
    [resultado[indice], resultado[sorteado]] = [resultado[sorteado], resultado[indice]];
  }
  return resultado;
}

function pontos(jogador: Jogador): number {
  return jogador.nivel ? PONTOS_NIVEL[jogador.nivel] : 2;
}

type EstadoTime = {
  time: TimeFormado;
  capacidade: number;
  pontos: number;
  niveisAltos: number;
};

function totalJogadoresTime(time: TimeFormado): number {
  return time.jogadoresLinha.length + (time.goleiro ? 1 : 0);
}

function criarTimes(
  jogadoresSelecionados: readonly Jogador[],
  tamanhosAlvo: readonly number[],
  usarEquilibrio: boolean,
  aleatorio: () => number,
  divisaoIgualPorFalta: boolean,
): TimeFormado[] {
  const estados: EstadoTime[] = tamanhosAlvo.map((capacidade, indice) => ({
    time: { numero: indice + 1, vagaExtraGoleiro: false, jogadoresLinha: [] },
    capacidade,
    pontos: 0,
    niveisAltos: 0,
  }));
  const goleirosSorteados = embaralhar(jogadoresSelecionados.filter((j) => j.tipo === "goleiro"), aleatorio);
  const ordemGoleiros = divisaoIgualPorFalta
    ? embaralhar(estados, aleatorio)
        .sort((a, b) => a.capacidade - b.capacidade)
        .map((estado) => estado.time.numero - 1)
    : [...embaralhar([0, 1].filter((indice) => indice < estados.length), aleatorio), ...embaralhar(Array.from({ length: Math.max(0, estados.length - 2) }, (_, i) => i + 2), aleatorio)];
  const quantidadeGoleirosReais = Math.min(goleirosSorteados.length, estados.length);

  for (let indice = 0; indice < quantidadeGoleirosReais; indice += 1) {
    let timeEscolhido: EstadoTime | undefined;
    timeEscolhido = estados[ordemGoleiros[indice]];
    if (!timeEscolhido) continue;
    const goleiro = goleirosSorteados[indice];
    timeEscolhido.time.goleiro = goleiro;
    timeEscolhido.pontos += pontos(goleiro);
    if (pontos(goleiro) >= 3) timeEscolhido.niveisAltos += 1;
  }

  const goleirosExcedentes = goleirosSorteados.slice(quantidadeGoleirosReais);
  const jogadoresDeLinha = jogadoresSelecionados.filter((j) => j.tipo !== "goleiro");
  const filaLinha = embaralhar([...jogadoresDeLinha, ...goleirosExcedentes], aleatorio);
  const temNivel = jogadoresSelecionados.some((j) => j.nivel !== undefined);
  const filaOrdenada = usarEquilibrio && temNivel
    ? filaLinha.map((jogador, ordem) => ({ jogador, ordem, pontos: pontos(jogador) }))
        .sort((a, b) => b.pontos - a.pontos || a.ordem - b.ordem)
        .map((item) => item.jogador)
    : filaLinha;
  const vagasAleatorias = usarEquilibrio && temNivel
    ? []
    : embaralhar(estados.flatMap((estado, indice) => Array.from(
        { length: estado.capacidade - totalJogadoresTime(estado.time) },
        () => indice,
      )), aleatorio);

  for (let indiceJogador = 0; indiceJogador < filaOrdenada.length; indiceJogador += 1) {
    const jogador = filaOrdenada[indiceJogador];
    const disponiveis = estados.filter((estado) => totalJogadoresTime(estado.time) < estado.capacidade);
    if (disponiveis.length === 0) break;
    let escolhido: EstadoTime;
    if (usarEquilibrio && temNivel) {
      const menorPontuacao = Math.min(...disponiveis.map((estado) => estado.pontos));
      const porPontuacao = disponiveis.filter((estado) => estado.pontos === menorPontuacao);
      const menorNivelAlto = Math.min(...porPontuacao.map((estado) => estado.niveisAltos));
      const porNivel = porPontuacao.filter((estado) => estado.niveisAltos === menorNivelAlto);
      const menorTotal = Math.min(...porNivel.map((estado) => totalJogadoresTime(estado.time)));
      const empatados = porNivel.filter((estado) => totalJogadoresTime(estado.time) === menorTotal);
      escolhido = embaralhar(empatados, aleatorio)[0];
    } else {
      escolhido = estados[vagasAleatorias[indiceJogador]];
    }
    escolhido.time.jogadoresLinha.push(jogador);
    escolhido.pontos += pontos(jogador);
    if (pontos(jogador) >= 3) escolhido.niveisAltos += 1;
  }

  return estados.map((estado) => estado.time);
}

function validarConservacao(
  jogadores: readonly Jogador[],
  times: readonly TimeFormado[],
  reservas: readonly Jogador[],
): Jogador[] {
  const alocados = times.flatMap((time) => [
    ...(time.goleiro ? [time.goleiro] : []),
    ...time.jogadoresLinha,
  ]);
  const idsOrigem = new Set(jogadores.map((j) => j.id));
  const idsSaida = [...alocados, ...reservas].map((j) => j.id);
  const idsUnicos = new Set(idsSaida);
  const ausentes = jogadores.filter((j) => !idsSaida.includes(j.id));
  const duplicados = idsSaida.filter((id, indice) => idsSaida.indexOf(id) !== indice);
  const estranhos = idsSaida.filter((id) => !idsOrigem.has(id));
  if (idsUnicos.size !== idsOrigem.size || ausentes.length > 0 || duplicados.length > 0 || estranhos.length > 0) {
    const detalhes = `total=${jogadores.length}, alocados=${alocados.length}, reservas=${reservas.length}, ausentes=[${ausentes.map((j) => j.id).join(",")}], duplicados=[${[...new Set(duplicados)].join(",")}], estranhos=[${[...new Set(estranhos)].join(",")}]`;
    if (__DEV__) throw new Error(`Falha na conservação dos jogadores: ${detalhes}`);
    console.error("Falha na conservação dos jogadores; corrigindo reservas.", detalhes);
    const jaAlocados = new Set<string>();
    for (const time of times) {
      if (time.goleiro) {
        if (!idsOrigem.has(time.goleiro.id) || jaAlocados.has(time.goleiro.id)) delete time.goleiro;
        else jaAlocados.add(time.goleiro.id);
      }
      time.jogadoresLinha = time.jogadoresLinha.filter((jogador) => {
        if (!idsOrigem.has(jogador.id) || jaAlocados.has(jogador.id)) return false;
        jaAlocados.add(jogador.id);
        return true;
      });
    }
    const idsEmSaida = new Set(jaAlocados);
    const reservasValidas = reservas.filter((jogador) => {
      if (!idsOrigem.has(jogador.id) || idsEmSaida.has(jogador.id)) return false;
      idsEmSaida.add(jogador.id);
      return true;
    });
    reservasValidas.push(...jogadores.filter((jogador) => !idsEmSaida.has(jogador.id)));
    return reservasValidas;
  }
  return [...reservas];
}

/** Distribui jogadores de forma pura; reservas são sempre o complemento dos times. */
export function dividirTimes(
  jogadores: readonly Jogador[],
  tamanhoTime: number | null = null,
  aleatorio: () => number = Math.random,
  quantidadeTimes?: number,
  equilibrarPorNivel = true,
): ResultadoDivisaoTimes {
  const total = jogadores.length;
  if (total > 0 && (new Set(jogadores.map((j) => j.id)).size !== total)) {
    throw new Error("O sorteio recebeu jogadores com identificadores duplicados.");
  }
  if (tamanhoTime !== null && (!Number.isInteger(tamanhoTime) || tamanhoTime < 2 || tamanhoTime > total)) {
    throw new RangeError(`Jogadores por time deve estar entre 2 e ${total}.`);
  }
  if (quantidadeTimes !== undefined && (!Number.isInteger(quantidadeTimes) || quantidadeTimes < 2 || quantidadeTimes > total)) {
    throw new RangeError(`A quantidade de times deve estar entre 2 e ${total}.`);
  }

  const sugestao = Math.max(2, Math.min(total || 2, sugerirTamanhoTimeSeguro(total)));
  const T = tamanhoTime ?? sugestao;
  if (total < 2) {
    return {
      times: [], reservas: [...jogadores], N: 0, T, R: total,
      totais: { jogadores: total, goleiros: jogadores.filter((j) => j.tipo === "goleiro").length, jogadoresLinha: jogadores.filter((j) => j.tipo !== "goleiro").length, reservas: total },
      motivo: "jogadores insuficientes",
    };
  }

  const N = quantidadeTimes ?? Math.max(2, Math.min(total, Math.floor(total / T)));
  const temT = tamanhoTime !== null;
  const temN = quantidadeTimes !== undefined;
  const precisaDividirIgual = (temN && !temT) || total < N * T;
  const quantidadeAlocada = precisaDividirIgual ? total : N * T;
  const embaralhados = embaralhar(jogadores, aleatorio);
  const tamanhos = precisaDividirIgual
    ? Array.from({ length: N }, (_, indice) => Math.floor(total / N) + (indice < total % N ? 1 : 0))
    : Array.from({ length: N }, () => T);
  const goleirosDeOrigem = jogadores.filter((jogador) => jogador.tipo === "goleiro");
  const goleirosSelecionados = embaralhar(goleirosDeOrigem, aleatorio).slice(0, Math.min(goleirosDeOrigem.length, N, quantidadeAlocada));
  const idsGoleirosSelecionados = new Set(goleirosSelecionados.map((jogador) => jogador.id));
  const candidatosDeLinha = embaralhados.filter((jogador) => !idsGoleirosSelecionados.has(jogador.id));
  const selecionados = [
    ...goleirosSelecionados,
    ...candidatosDeLinha.slice(0, Math.max(0, quantidadeAlocada - goleirosSelecionados.length)),
  ];
  const times = criarTimes(selecionados, tamanhos, equilibrarPorNivel, aleatorio, precisaDividirIgual);

  if (!precisaDividirIgual && times.length > 0) {
    const foraDosTimesPrioritarios = times.slice(2).reduce((soma, time) => soma + totalJogadoresTime(time), 0) + (total - quantidadeAlocada);
    const semGoleiro = times.slice(0, 2).filter((time) => !time.goleiro);
    semGoleiro.slice(0, Math.min(semGoleiro.length, foraDosTimesPrioritarios)).forEach((time) => { time.vagaExtraGoleiro = true; });
  }

  const idsAlocados = new Set(times.flatMap((time) => [
    ...(time.goleiro ? [time.goleiro.id] : []),
    ...time.jogadoresLinha.map((j) => j.id),
  ]));
  const reservasCalculadas = jogadores.filter((j) => !idsAlocados.has(j.id));
  const reservas = validarConservacao(jogadores, times, reservasCalculadas);
  const tamanhosReais = times.map(totalJogadoresTime);
  const tamanhoResumo = temN && !temT ? Math.max(...tamanhosReais) : T;

  return {
    times,
    reservas,
    N,
    T: tamanhoResumo,
    R: reservas.length,
    totais: {
      jogadores: total,
      goleiros: jogadores.filter((j) => j.tipo === "goleiro").length,
      jogadoresLinha: jogadores.filter((j) => j.tipo !== "goleiro").length,
      reservas: reservas.length,
    },
    motivo: (temN && temT && total < N * T) || (temT && !temN && total < 2 * T) || (!temN && !temT && total < 2 * T)
      ? "poucos jogadores"
      : null,
    quantidadeTimesInformada: temN,
    divisaoIgual: precisaDividirIgual,
  };
}

function sugerirTamanhoTimeSeguro(total: number): number {
  if (total < 2) return 2;
  const candidatos = Array.from({ length: 9 }, (_, indice) => indice + 3)
    .map((tamanho) => ({ tamanho, times: Math.floor(total / tamanho), sobra: total % tamanho }))
    .filter((item) => item.times >= 2);
  candidatos.sort((a, b) => a.sobra - b.sobra || Math.abs(a.tamanho - 6) - Math.abs(b.tamanho - 6) || a.tamanho - b.tamanho);
  return candidatos[0]?.tamanho ?? Math.max(2, Math.ceil(total / 2));
}
