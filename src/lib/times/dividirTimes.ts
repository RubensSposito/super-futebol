import type { Jogador, ResultadoDivisaoTimes, TimeFormado } from "@/types";

function embaralhar<T>(itens: readonly T[], aleatorio: () => number): T[] {
  const resultado = [...itens];
  for (let indice = resultado.length - 1; indice > 0; indice -= 1) {
    const sorteado = Math.floor(aleatorio() * (indice + 1));
    [resultado[indice], resultado[sorteado]] = [
      resultado[sorteado],
      resultado[indice],
    ];
  }
  return resultado;
}

export function dividirTimes(
  jogadores: readonly Jogador[],
  tamanhoTime: number,
  aleatorio: () => number = Math.random,
): ResultadoDivisaoTimes {
  if (!Number.isInteger(tamanhoTime) || tamanhoTime < 1) {
    throw new RangeError("O tamanho do time deve ser um inteiro positivo.");
  }

  const goleiros = jogadores.filter(
    (jogador) => jogador.tipo === "goleiro",
  );
  const jogadoresDeLinha = jogadores.filter(
    (jogador) => jogador.tipo === "linha",
  );
  const totalGoleiros = goleiros.length;
  const totalJogadoresLinha = jogadoresDeLinha.length;

  if (jogadores.length < 2) {
    return {
      times: [],
      reservas: [...jogadores],
      N: 0,
      T: tamanhoTime,
      R: jogadores.length,
      totais: {
        jogadores: jogadores.length,
        goleiros: totalGoleiros,
        jogadoresLinha: totalJogadoresLinha,
        reservas: jogadores.length,
      },
      motivo: "jogadores insuficientes",
    };
  }

  const numeroTimes = Math.floor(jogadores.length / tamanhoTime);
  const resultado =
    jogadores.length >= 2 * tamanhoTime
    ? dividirTimesComTamanho(
        jogadores.length,
        tamanhoTime,
        numeroTimes,
        goleiros,
        jogadoresDeLinha,
        aleatorio,
      )
    : dividirEmDoisTimes(
        tamanhoTime,
        goleiros,
        jogadoresDeLinha,
        aleatorio,
      );

  return {
    ...resultado,
    totais: {
      jogadores: jogadores.length,
      goleiros: totalGoleiros,
      jogadoresLinha: totalJogadoresLinha,
      reservas: resultado.reservas.length,
    },
    motivo: null,
  };
}

function dividirTimesComTamanho(
  totalJogadores: number,
  tamanhoTime: number,
  numeroTimes: number,
  goleiros: readonly Jogador[],
  jogadoresDeLinha: readonly Jogador[],
  aleatorio: () => number,
): Pick<ResultadoDivisaoTimes, "times" | "reservas" | "N" | "T" | "R"> {
  const primeirosTimes = embaralhar([0, 1], aleatorio);
  const outrosTimes = embaralhar(
    Array.from({ length: numeroTimes - 2 }, (_, indice) => indice + 2),
    aleatorio,
  );
  const ordemPrioridade = [...primeirosTimes, ...outrosTimes];
  const goleirosSorteados = embaralhar(goleiros, aleatorio);
  const goleiroPorTime = new Map<number, Jogador>();

  goleirosSorteados.slice(0, numeroTimes).forEach((goleiro, indice) => {
    goleiroPorTime.set(ordemPrioridade[indice], goleiro);
  });

  const goleirosExcedentes = goleirosSorteados.slice(numeroTimes);
  const linhaSorteada = embaralhar(
    [...jogadoresDeLinha, ...goleirosExcedentes],
    aleatorio,
  );
  const vagasPorTime = Array.from(
    { length: numeroTimes },
    (_, indice) => tamanhoTime - (goleiroPorTime.has(indice) ? 1 : 0),
  );
  const sobras = totalJogadores - numeroTimes * tamanhoTime;
  const times: TimeFormado[] = [];
  let inicioLinha = 0;

  for (let indice = 0; indice < numeroTimes; indice += 1) {
    const vagasLinha = vagasPorTime[indice];
    times.push({
      numero: indice + 1,
      ...(goleiroPorTime.has(indice)
        ? { goleiro: goleiroPorTime.get(indice) }
        : {}),
      vagaExtraGoleiro: false,
      jogadoresLinha: linhaSorteada.slice(
        inicioLinha,
        inicioLinha + vagasLinha,
      ),
    });
    inicioLinha += vagasLinha;
  }

  const reservas = linhaSorteada.slice(inicioLinha);
  const jogadoresForaDosDoisPrimeiros =
    times
      .slice(2)
      .reduce(
        (total, time) =>
          total + time.jogadoresLinha.length + (time.goleiro ? 1 : 0),
        0,
      ) + reservas.length;
  const timesSemGoleiro = times
    .slice(0, 2)
    .filter((time) => !time.goleiro);
  const vagasExtras = Math.min(
    timesSemGoleiro.length,
    jogadoresForaDosDoisPrimeiros,
  );

  for (const time of timesSemGoleiro.slice(0, vagasExtras)) {
    time.vagaExtraGoleiro = true;
  }

  return {
    times,
    reservas,
    N: numeroTimes,
    T: tamanhoTime,
    R: sobras,
  };
}

function dividirEmDoisTimes(
  tamanhoTime: number,
  goleiros: readonly Jogador[],
  jogadoresDeLinha: readonly Jogador[],
  aleatorio: () => number,
): Pick<ResultadoDivisaoTimes, "times" | "reservas" | "N" | "T" | "R"> {
  const goleirosSorteados = embaralhar(goleiros, aleatorio);
  const goleirosReais = goleirosSorteados.slice(0, 2);
  const goleirosExcedentes = goleirosSorteados.slice(2);
  const linhaSorteada = embaralhar(
    [...jogadoresDeLinha, ...goleirosExcedentes],
    aleatorio,
  );
  const quantidadeMaior = linhaSorteada.length % 2;
  const indiceTimeMaior =
    quantidadeMaior === 1 ? Math.floor(aleatorio() * 2) : -1;
  const quantidadesLinha = [0, 0];
  quantidadesLinha[0] = Math.floor(linhaSorteada.length / 2);
  quantidadesLinha[1] = Math.floor(linhaSorteada.length / 2);
  if (indiceTimeMaior >= 0) {
    quantidadesLinha[indiceTimeMaior] += 1;
  }

  const jogadoresLinhaPorTime = [
    linhaSorteada.slice(0, quantidadesLinha[0]),
    linhaSorteada.slice(quantidadesLinha[0]),
  ];
  const ordemGoleiros =
    quantidadesLinha[0] === quantidadesLinha[1]
      ? embaralhar([0, 1], aleatorio)
      : quantidadesLinha[0] < quantidadesLinha[1]
        ? [0, 1]
        : [1, 0];
  const goleiroPorTime = new Map<number, Jogador>();
  goleirosReais.forEach((goleiro, indice) => {
    goleiroPorTime.set(ordemGoleiros[indice], goleiro);
  });

  const times: TimeFormado[] = [0, 1].map((indice) => ({
    numero: indice + 1,
    ...(goleiroPorTime.has(indice)
      ? { goleiro: goleiroPorTime.get(indice) }
      : {}),
    vagaExtraGoleiro: false,
    jogadoresLinha: jogadoresLinhaPorTime[indice],
  }));

  return {
    times,
    reservas: [],
    N: 2,
    T: tamanhoTime,
    R: 0,
  };
}
