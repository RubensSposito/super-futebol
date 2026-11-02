export function calcularMensalidadeCentavos(
  valorQuadraCentavos: number,
  quantidadeMensalistas: number,
): number {
  if (
    !Number.isSafeInteger(valorQuadraCentavos) ||
    valorQuadraCentavos < 0 ||
    !Number.isInteger(quantidadeMensalistas) ||
    quantidadeMensalistas < 1
  ) {
    throw new RangeError("Valor da quadra e quantidade de mensalistas inválidos.");
  }

  return Math.ceil(valorQuadraCentavos / quantidadeMensalistas / 100) * 100;
}
