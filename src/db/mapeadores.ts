import type {
  ControlePagamento,
  FrequenciaFutebol,
  Futebol,
  Jogador,
  Nivel,
  Posicao,
  TipoCadastro,
  TipoJogador,
  Vinculo,
} from "@/types";

export type LinhaJogador = {
  id: number;
  nome: string;
  tipo: TipoJogador;
  posicao: Posicao | null;
  nivel: Nivel | null;
  vinculo: Vinculo | null;
};

export type LinhaFutebol = {
  quantidade_jogadores: number;
  quantidade_mensalistas: number | null;
  quantidade_avulsos: number | null;
  tipo_cadastro: TipoCadastro;
  controla_presenca: number;
  controle_pagamento: ControlePagamento;
  valor_quadra_centavos: number | null;
  mensalidade_centavos: number | null;
  mensalidade_sugerida_centavos: number | null;
  avulso_escolhido_centavos: number | null;
  avulso_sugerido_centavos: number | null;
  nome_quadra: string | null;
  endereco: string | null;
  dias_semana: string | null;
  frequencia: FrequenciaFutebol | null;
  horario: string | null;
  data_criacao: string;
};

export function mapearJogador(linha: LinhaJogador): Jogador {
  return {
    id: String(linha.id),
    nome: linha.nome,
    tipo: linha.tipo,
    ...(linha.posicao ? { posicao: linha.posicao } : {}),
    ...(linha.nivel ? { nivel: linha.nivel } : {}),
    ...(linha.vinculo ? { vinculo: linha.vinculo } : {}),
  };
}

export function mapearFutebol(linha: LinhaFutebol): Futebol {
  return {
    quantidadeJogadores: linha.quantidade_jogadores,
    quantidadeMensalistas: linha.quantidade_mensalistas,
    quantidadeAvulsos: linha.quantidade_avulsos,
    tipoCadastro: linha.tipo_cadastro,
    controlaPresenca: linha.controla_presenca === 1,
    controlePagamento: linha.controle_pagamento,
    valorQuadraCentavos: linha.valor_quadra_centavos,
    mensalidadeSugeridaCentavos: linha.mensalidade_sugerida_centavos,
    mensalidadeCentavos: linha.mensalidade_centavos,
    avulsoEscolhidoCentavos: linha.avulso_escolhido_centavos,
    avulsoSugeridoCentavos: linha.avulso_sugerido_centavos,
    nomeQuadra: linha.nome_quadra,
    endereco: linha.endereco,
    diasSemana: linha.dias_semana
      ? linha.dias_semana.split(",").map(Number)
      : [],
    frequencia: linha.frequencia,
    horario: linha.horario,
    dataCriacao: linha.data_criacao,
  };
}
