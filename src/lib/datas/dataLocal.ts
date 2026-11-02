function doisDigitos(valor: number): string {
  return valor.toString().padStart(2, "0");
}

export function obterDataLocal(data: Date = new Date()): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

export function formatarDataCurta(dataIso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) {
    throw new RangeError("Data inválida. Esperado AAAA-MM-DD.");
  }
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    throw new RangeError("Data inválida. Esperado AAAA-MM-DD.");
  }
  return `${dataIso.slice(8, 10)}/${dataIso.slice(5, 7)}`;
}

export function deslocarDataLocal(dataIso: string, dias: number): string {
  if (!Number.isInteger(dias)) {
    throw new RangeError("Data ou deslocamento inválido.");
  }
  formatarDataCurta(dataIso);
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  return obterDataLocal(new Date(ano, mes - 1, dia + dias));
}

export function obterDiaDaSemana(dataIso: string): number {
  formatarDataCurta(dataIso);
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).getDay();
}

function validarDiasSemana(diasSemana: readonly number[]): void {
  if (
    diasSemana.some(
      (dia) => !Number.isSafeInteger(dia) || dia < 0 || dia > 6,
    ) ||
    new Set(diasSemana).size !== diasSemana.length
  ) {
    throw new RangeError("Dias da semana inválidos.");
  }
}

export function formatarCabecalhoData(dataIso: string): string {
  const dia = DIAS_CURTOS[obterDiaDaSemana(dataIso)];
  return `${dia}, ${formatarDataCurta(dataIso)}`;
}

const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function obterDataInicialAgenda(
  hoje: string,
  diasSemana: readonly number[],
): string {
  validarDiasSemana(diasSemana);
  if (
    diasSemana.length === 0 ||
    diasSemana.includes(obterDiaDaSemana(hoje))
  ) {
    return hoje;
  }
  return obterDataJogoSeguinte(hoje, diasSemana);
}

export function obterJogoAtivo(
  hoje: string,
  diasSemana: readonly number[],
): string {
  return obterDataInicialAgenda(hoje, diasSemana);
}

export function calcularDiasAteJogo(
  dataJogo: string,
  dataReferencia: string,
): number {
  formatarDataCurta(dataJogo);
  formatarDataCurta(dataReferencia);
  if (dataJogo === dataReferencia) return 0;

  const incremento = dataJogo > dataReferencia ? 1 : -1;
  let dataAtual = dataReferencia;
  let diferenca = 0;
  while (dataAtual !== dataJogo) {
    dataAtual = deslocarDataLocal(dataAtual, incremento);
    diferenca += incremento;
  }
  return diferenca;
}

export function formatarFaixaStatusJogo(
  dataJogo: string,
  hoje: string,
  diasSemana: readonly number[],
  horario: string | null,
): string {
  formatarDataCurta(dataJogo);
  formatarDataCurta(hoje);
  validarDiasSemana(diasSemana);

  if (diasSemana.length === 0) return formatarCabecalhoData(dataJogo);
  const diasAteJogo = calcularDiasAteJogo(dataJogo, hoje);
  const dataFormatada = formatarCabecalhoData(dataJogo).replace(", ", " ");

  if (diasAteJogo < 0) {
    return `Jogo passado · ${dataFormatada}`;
  }
  if (diasAteJogo === 0) {
    return `Jogo hoje${horario ? ` · ${horario}` : ""}`;
  }
  const quando =
    diasAteJogo === 1 ? "amanhã" : `em ${diasAteJogo} dias`;
  return `Jogo ${quando} · ${dataFormatada}${horario ? ` · ${horario}` : ""}`;
}

export function obterDataJogoSeguinte(
  dataIso: string,
  diasSemana: readonly number[],
): string {
  validarDiasSemana(diasSemana);
  formatarDataCurta(dataIso);
  if (diasSemana.length === 0) return deslocarDataLocal(dataIso, 1);
  for (let deslocamento = 1; deslocamento <= 7; deslocamento += 1) {
    const dataCandidata = deslocarDataLocal(dataIso, deslocamento);
    if (diasSemana.includes(obterDiaDaSemana(dataCandidata))) {
      return dataCandidata;
    }
  }
  throw new RangeError("Não foi possível encontrar o próximo dia de jogo.");
}

export function obterDataJogoAnterior(
  dataIso: string,
  diasSemana: readonly number[],
): string {
  validarDiasSemana(diasSemana);
  formatarDataCurta(dataIso);
  if (diasSemana.length === 0) return deslocarDataLocal(dataIso, -1);
  for (let deslocamento = 1; deslocamento <= 7; deslocamento += 1) {
    const dataCandidata = deslocarDataLocal(dataIso, -deslocamento);
    if (diasSemana.includes(obterDiaDaSemana(dataCandidata))) {
      return dataCandidata;
    }
  }
  throw new RangeError("Não foi possível encontrar o dia de jogo anterior.");
}

export function obterLimiteDataFutura(hoje: string): string {
  return deslocarDataLocal(hoje, 30);
}

export function dataDentroDosLimites(
  dataIso: string,
  dataCriacao: string,
  hoje: string,
): boolean {
  formatarDataCurta(dataIso);
  formatarDataCurta(dataCriacao);
  formatarDataCurta(hoje);
  return dataIso >= dataCriacao && dataIso <= obterLimiteDataFutura(hoje);
}
