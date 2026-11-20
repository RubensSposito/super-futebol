export function normalizarNomeFutebol(nome: string): string {
  return nome.trim().replace(/\s+/g, " ");
}

export function nomeNormalizadoFutebol(nome: string): string {
  return normalizarNomeFutebol(nome).toLocaleLowerCase("pt-BR");
}
