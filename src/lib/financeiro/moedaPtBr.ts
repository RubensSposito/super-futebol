export function formatarMoedaPtBr(centavos: number): string {
  const valor = Math.abs(Math.trunc(centavos));
  const reais = Math.floor(valor / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const fracao = (valor % 100).toString().padStart(2, "0");
  return `${centavos < 0 ? "-" : ""}R$ ${reais},${fracao}`;
}

/**
 * Aplica máscara de moeda brasileira (R$ 0,00) em tempo real conforme o usuário digita.
 * Se o campo for limpo, retorna string vazia.
 */
export function mascararMoedaAoDigitar(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (!digitos) return "";

  const centavos = parseInt(digitos, 10);
  if (isNaN(centavos) || centavos === 0) return "";

  return formatarMoedaPtBr(centavos);
}

export function lerMoedaPtBr(valor: string): number | null {
  const texto = valor.trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
  if (!texto) return null;

  const formatoValido =
    /^\d+(?:\.\d{3})*(?:,\d{0,2})?$/.test(texto) ||
    /^\d+(?:,\d{0,2})?$/.test(texto);
  if (!formatoValido) return null;

  const [reaisTexto, centavosTexto = ""] = texto.replace(/\./g, "").split(",");
  const reais = Number(reaisTexto);
  const centavos = Number(centavosTexto.padEnd(2, "0") || "0");
  const total = reais * 100 + centavos;
  return Number.isSafeInteger(total) ? total : null;
}
