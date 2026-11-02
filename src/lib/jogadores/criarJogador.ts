import type {
  Jogador,
  NovoJogador,
  ResultadoCriacaoJogador,
  ResultadoValidacaoJogador,
} from "@/types";

export function normalizarNomeJogador(nome: string): string {
  return nome.trim().replace(/\s+/g, " ");
}

function nomeParaComparacao(nome: string): string {
  return normalizarNomeJogador(nome).toLowerCase();
}

export function validarNovoJogador(
  novoJogador: NovoJogador,
  existentes: readonly (Pick<Jogador, "nome"> & Partial<Pick<Jogador, "id">>)[],
  ignorarId?: string,
): ResultadoValidacaoJogador {
  const nome = normalizarNomeJogador(novoJogador.nome);
  if (!nome) {
    return { valido: false, motivo: "nome_vazio" };
  }
  if (novoJogador.tipo !== "goleiro" && novoJogador.tipo !== "linha") {
    return { valido: false, motivo: "tipo_invalido" };
  }
  if (
    (novoJogador.tipo === "goleiro" &&
      novoJogador.posicao !== undefined &&
      novoJogador.posicao !== "goleiro") ||
    (novoJogador.tipo === "linha" && novoJogador.posicao === "goleiro")
  ) {
    return { valido: false, motivo: "posicao_invalida" };
  }

  const nomeNormalizado = nomeParaComparacao(nome);
  if (
    existentes.some(
      (jogador) =>
        jogador.id !== ignorarId &&
        nomeParaComparacao(jogador.nome) === nomeNormalizado,
    )
  ) {
    return { valido: false, motivo: "nome_duplicado" };
  }

  return { valido: true, nome };
}

let contadorIds = 0;

function gerarIdJogador(existentes: readonly Jogador[]): string {
  let id: string;
  do {
    contadorIds += 1;
    id = `${Date.now().toString(36)}-${contadorIds.toString(36)}`;
  } while (existentes.some((jogador) => jogador.id === id));
  return id;
}

export function criarJogador(
  novoJogador: NovoJogador,
  existentes: readonly Jogador[],
): ResultadoCriacaoJogador {
  const validacao = validarNovoJogador(novoJogador, existentes);
  if (!validacao.valido) {
    return { sucesso: false, motivo: validacao.motivo };
  }

  const jogador: Jogador = {
    id: gerarIdJogador(existentes),
    nome: validacao.nome,
    tipo: novoJogador.tipo,
    posicao:
      novoJogador.tipo === "goleiro" ? "goleiro" : novoJogador.posicao,
    ...(novoJogador.nivel !== undefined ? { nivel: novoJogador.nivel } : {}),
    ...(novoJogador.vinculo !== undefined ? { vinculo: novoJogador.vinculo } : {}),
  };
  return { sucesso: true, jogador };
}
