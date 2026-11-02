export function sugerirTamanhoTime(totalJogadores: number): number {
  if (!Number.isInteger(totalJogadores) || totalJogadores < 0) {
    throw new RangeError("A quantidade de jogadores deve ser um inteiro não negativo.");
  }

  const candidatos = Array.from({ length: 9 }, (_, indice) => indice + 3)
    .map((tamanho) => {
      const numeroTimes = Math.floor(totalJogadores / tamanho);
      return {
        tamanho,
        numeroTimes,
        sobra: totalJogadores - numeroTimes * tamanho,
      };
    })
    .filter((candidato) => candidato.numeroTimes >= 2);

  if (candidatos.length === 0) {
    return Math.max(2, Math.ceil(totalJogadores / 2));
  }

  candidatos.sort(
    (a, b) =>
      a.sobra - b.sobra ||
      Math.abs(a.tamanho - 6) - Math.abs(b.tamanho - 6) ||
      a.tamanho - b.tamanho,
  );
  return candidatos[0].tamanho;
}
