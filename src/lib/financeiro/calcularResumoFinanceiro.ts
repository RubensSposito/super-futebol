import type { FrequenciaFutebol } from "@/types";
import { calcularMensalidadeCentavos } from "./calcularMensalidade";

export type ResumoFinanceiro = {
  totalJogadores: number;
  mensalidadeSugeridaCentavos: number;
  mensalidadeEscolhidaCentavos: number | null;
  mensalidadeEscolhidaTotalCentavos: number | null;
  mensalidadeSugeridaTotalCentavos: number;
  diferencaMensalidadeCentavos: number | null;
  avulsoSugeridoCentavos: number;
  avulsoEscolhidoCentavos: number | null;
  avulsoSugeridoTotalCentavos: number;
  avulsoEscolhidoTotalCentavos: number | null;
};

function validarQuantidadeEValor(
  quantidade: number,
  valorCentavos: number,
  nome: string,
): void {
  if (
    !Number.isSafeInteger(quantidade) ||
    quantidade < 0 ||
    !Number.isSafeInteger(valorCentavos) ||
    valorCentavos < 0 ||
    !Number.isSafeInteger(quantidade * valorCentavos)
  ) {
    throw new RangeError(`${nome}: quantidade ou valor inválido.`);
  }
}

export function calcularArrecadacaoMensalistas(
  quantidadeMensalistas: number,
  mensalidadeCentavos: number,
): number {
  validarQuantidadeEValor(
    quantidadeMensalistas,
    mensalidadeCentavos,
    "Arrecadação de mensalistas",
  );
  return quantidadeMensalistas * mensalidadeCentavos;
}

export function calcularArrecadacaoAvulsos(
  quantidadeAvulsos: number,
  valorAvulsoCentavos: number,
): number {
  validarQuantidadeEValor(
    quantidadeAvulsos,
    valorAvulsoCentavos,
    "Arrecadação de avulsos",
  );
  return quantidadeAvulsos * valorAvulsoCentavos;
}

export function calcularSaldoTotal(
  arrecadacaoTotalCentavos: number,
  valorQuadraCentavos: number,
): number {
  if (
    !Number.isSafeInteger(arrecadacaoTotalCentavos) ||
    arrecadacaoTotalCentavos < 0 ||
    !Number.isSafeInteger(valorQuadraCentavos) ||
    valorQuadraCentavos < 0
  ) {
    throw new RangeError("Saldo total: valores inválidos.");
  }
  const saldo = arrecadacaoTotalCentavos - valorQuadraCentavos;
  if (!Number.isSafeInteger(saldo)) {
    throw new RangeError("Saldo total excede o limite seguro.");
  }
  return saldo;
}

export function calcularArrecadacaoTotal(
  arrecadacaoMensalistasCentavos: number,
  arrecadacaoAvulsosCentavos: number,
): number {
  if (
    !Number.isSafeInteger(arrecadacaoMensalistasCentavos) ||
    arrecadacaoMensalistasCentavos < 0 ||
    !Number.isSafeInteger(arrecadacaoAvulsosCentavos) ||
    arrecadacaoAvulsosCentavos < 0
  ) {
    throw new RangeError("Arrecadação total: valores inválidos.");
  }
  const total =
    arrecadacaoMensalistasCentavos + arrecadacaoAvulsosCentavos;
  if (!Number.isSafeInteger(total)) {
    throw new RangeError("Arrecadação total excede o limite seguro.");
  }
  return total;
}

export function calcularSaldoMensalistas(
  quantidadeMensalistas: number,
  mensalidadeCentavos: number,
  valorQuadraCentavos: number,
): number {
  return calcularSaldoTotal(
    calcularArrecadacaoMensalistas(
      quantidadeMensalistas,
      mensalidadeCentavos,
    ),
    valorQuadraCentavos,
  );
}

export function calcularJogosPorMes(
  frequencia: FrequenciaFutebol | null,
  diasSemana: readonly number[],
): number {
  if (
    diasSemana.some(
      (dia) => !Number.isSafeInteger(dia) || dia < 0 || dia > 6,
    ) ||
    new Set(diasSemana).size !== diasSemana.length
  ) {
    throw new RangeError("Dias da semana inválidos.");
  }
  if (frequencia === null || diasSemana.length === 0) return 1;
  const jogosFrequencia: Record<FrequenciaFutebol, number> = {
    semanal: 4,
    quinzenal: 2,
    mensal: 1,
  };
  return jogosFrequencia[frequencia] * diasSemana.length;
}

export function calcularPrevisaoAvulsos(
  quantidadeAvulsos: number,
  valorAvulsoCentavos: number | null,
  jogosPorMes: number,
): number | null {
  if (valorAvulsoCentavos === null) return null;
  validarQuantidadeEValor(
    quantidadeAvulsos,
    valorAvulsoCentavos,
    "Previsão de avulsos",
  );
  if (!Number.isSafeInteger(jogosPorMes) || jogosPorMes < 1) {
    throw new RangeError("Quantidade de jogos por mês inválida.");
  }
  const total =
    quantidadeAvulsos * valorAvulsoCentavos * jogosPorMes;
  if (!Number.isSafeInteger(total)) {
    throw new RangeError("Previsão de avulsos excede o limite seguro.");
  }
  return total;
}

export function calcularPrevisaoTotalMes(
  saldoAtualCentavos: number,
  previsaoAvulsosCentavos: number,
): number {
  if (
    !Number.isSafeInteger(saldoAtualCentavos) ||
    !Number.isSafeInteger(previsaoAvulsosCentavos) ||
    previsaoAvulsosCentavos < 0
  ) {
    throw new RangeError("Previsão total do mês: valores inválidos.");
  }
  const total = saldoAtualCentavos + previsaoAvulsosCentavos;
  if (!Number.isSafeInteger(total)) {
    throw new RangeError("Previsão total do mês excede o limite seguro.");
  }
  return total;
}

export function calcularMensalistasNecessarios(
  saldoCentavos: number,
  mensalidadeCentavos: number | null,
): number | null {
  if (mensalidadeCentavos === null || mensalidadeCentavos === 0) return null;
  if (!Number.isSafeInteger(saldoCentavos) || saldoCentavos > 0) {
    if (saldoCentavos >= 0) return 0;
    throw new RangeError("Saldo atual inválido.");
  }
  validarQuantidadeEValor(1, mensalidadeCentavos, "Mensalistas necessários");
  return Math.ceil(Math.abs(saldoCentavos) / mensalidadeCentavos);
}

export function calcularCoberturaQuadraPercentual(
  arrecadacaoMensalistasCentavos: number,
  valorQuadraCentavos: number,
): number {
  if (
    !Number.isSafeInteger(arrecadacaoMensalistasCentavos) ||
    arrecadacaoMensalistasCentavos < 0 ||
    !Number.isSafeInteger(valorQuadraCentavos) ||
    valorQuadraCentavos < 0
  ) {
    throw new RangeError("Cobertura da quadra: valores inválidos.");
  }
  if (valorQuadraCentavos === 0) return 100;
  return (arrecadacaoMensalistasCentavos / valorQuadraCentavos) * 100;
}

export function calcularAvulsosNecessarios(
  valorQuadraCentavos: number,
  arrecadacaoMensalistasCentavos: number,
  valorAvulsoCentavos: number | null,
  jogosPorMes = 1,
): number | null {
  if (valorAvulsoCentavos === null || valorAvulsoCentavos === 0) {
    return null;
  }
  if (
    !Number.isSafeInteger(valorQuadraCentavos) ||
    valorQuadraCentavos < 0 ||
    !Number.isSafeInteger(arrecadacaoMensalistasCentavos) ||
    arrecadacaoMensalistasCentavos < 0
  ) {
    throw new RangeError("Avulsos necessários: valores inválidos.");
  }
  validarQuantidadeEValor(
    1,
    valorAvulsoCentavos,
    "Avulsos necessários",
  );
  if (!Number.isSafeInteger(jogosPorMes) || jogosPorMes < 1) {
    throw new RangeError("Quantidade de jogos por mês inválida.");
  }
  const valorRestante = valorQuadraCentavos - arrecadacaoMensalistasCentavos;
  if (valorRestante <= 0) return 0;
  const valorPorAvulsoNoMes = valorAvulsoCentavos * jogosPorMes;
  if (!Number.isSafeInteger(valorPorAvulsoNoMes)) {
    throw new RangeError("Valor mensal por avulso excede o limite seguro.");
  }
  const quantidade = Math.ceil(valorRestante / valorPorAvulsoNoMes);
  if (!Number.isSafeInteger(quantidade)) {
    throw new RangeError("Quantidade de avulsos excede o limite seguro.");
  }
  return quantidade;
}

export function calcularAvulsoSugeridoCentavos(
  valorQuadraCentavos: number,
  totalJogadores: number,
): number {
  return calcularMensalidadeCentavos(valorQuadraCentavos, totalJogadores);
}

export function calcularResumoFinanceiro(
  valorQuadraCentavos: number,
  quantidadeMensalistas: number,
  quantidadeAvulsos: number,
  mensalidadeEscolhidaCentavos: number | null,
  avulsoEscolhidoCentavos: number | null,
): ResumoFinanceiro {
  const totalJogadores = quantidadeMensalistas + quantidadeAvulsos;
  if (
    !Number.isInteger(quantidadeAvulsos) ||
    quantidadeAvulsos < 0 ||
    totalJogadores < 1
  ) {
    throw new RangeError("As quantidades de jogadores são inválidas.");
  }
  const mensalidadeSugeridaCentavos = calcularMensalidadeCentavos(
    valorQuadraCentavos,
    quantidadeMensalistas,
  );
  const avulsoSugeridoCentavos = calcularAvulsoSugeridoCentavos(
    valorQuadraCentavos,
    totalJogadores,
  );
  const mensalidadeSugeridaTotalCentavos = calcularArrecadacaoMensalistas(
    quantidadeMensalistas,
    mensalidadeSugeridaCentavos,
  );
  const mensalidadeEscolhidaTotalCentavos =
    mensalidadeEscolhidaCentavos === null
      ? null
      : calcularArrecadacaoMensalistas(
          quantidadeMensalistas,
          mensalidadeEscolhidaCentavos,
        );

  return {
    totalJogadores,
    mensalidadeSugeridaCentavos,
    mensalidadeEscolhidaCentavos,
    mensalidadeEscolhidaTotalCentavos,
    mensalidadeSugeridaTotalCentavos,
    diferencaMensalidadeCentavos:
      mensalidadeEscolhidaTotalCentavos === null
        ? null
        : mensalidadeEscolhidaTotalCentavos - valorQuadraCentavos,
    avulsoSugeridoCentavos,
    avulsoEscolhidoCentavos,
    avulsoSugeridoTotalCentavos: calcularArrecadacaoAvulsos(
      quantidadeAvulsos,
      avulsoSugeridoCentavos,
    ),
    avulsoEscolhidoTotalCentavos:
      avulsoEscolhidoCentavos === null
        ? null
        : calcularArrecadacaoAvulsos(
            quantidadeAvulsos,
            avulsoEscolhidoCentavos,
          ),
  };
}
