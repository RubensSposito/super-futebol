import { deslocarDataLocal, formatarDataCurta } from "../datas/dataLocal";

function formatarPartes(ano: number, mes: number, dia: number): string {
  return `${ano.toString().padStart(4, "0")}-${mes.toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;
}

function obterOcorrencia(ano: number, mes: number, diaPagamento: number): string {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return formatarPartes(ano, mes, Math.min(diaPagamento, ultimoDia));
}

function mesAnterior(ano: number, mes: number): [number, number] {
  return mes === 1 ? [ano - 1, 12] : [ano, mes - 1];
}

function mesSeguinte(ano: number, mes: number): [number, number] {
  return mes === 12 ? [ano + 1, 1] : [ano, mes + 1];
}

function validarDiaPagamento(diaPagamento: number): void {
  if (!Number.isSafeInteger(diaPagamento) || diaPagamento < 1 || diaPagamento > 31) {
    throw new RangeError("O dia de pagamento deve estar entre 1 e 31.");
  }
}

export type CicloMensal = {
  inicio: string;
  fim: string;
  proximoVencimento: string;
  diasAteVencimento: number;
};

export function calcularCicloMensal(
  diaPagamento: number,
  dataReferencia: string,
): CicloMensal {
  validarDiaPagamento(diaPagamento);
  formatarDataCurta(dataReferencia);
  const [ano, mes] = dataReferencia.split("-").map(Number);
  let inicio = obterOcorrencia(ano, mes, diaPagamento);
  if (inicio > dataReferencia) {
    const [anoAnterior, mesAnteriorNumero] = mesAnterior(ano, mes);
    inicio = obterOcorrencia(anoAnterior, mesAnteriorNumero, diaPagamento);
  }
  const [anoProximo, mesProximo] = mesSeguinte(Number(inicio.slice(0, 4)), Number(inicio.slice(5, 7)));
  const proximoVencimento = obterOcorrencia(anoProximo, mesProximo, diaPagamento);
  const fim = deslocarDataLocal(proximoVencimento, -1);
  let diasAteVencimento = 0;
  if (inicio !== dataReferencia) {
    for (let data = dataReferencia; data < proximoVencimento; data = deslocarDataLocal(data, 1)) {
      diasAteVencimento += 1;
    }
  }
  return { inicio, fim, proximoVencimento, diasAteVencimento };
}

export function calcularInicioProximoCiclo(inicioAtual: string, diaPagamento: number): string {
  validarDiaPagamento(diaPagamento);
  formatarDataCurta(inicioAtual);
  const [ano, mes] = inicioAtual.split("-").map(Number);
  const [anoProximo, mesProximo] = mesSeguinte(ano, mes);
  return obterOcorrencia(anoProximo, mesProximo, diaPagamento);
}
