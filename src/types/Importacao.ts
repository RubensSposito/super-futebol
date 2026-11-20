import type { Jogador, NovoJogador } from "./Jogador";

export type ResultadoLeituraLista = {
  goleiros: NovoJogador[];
  jogadores: NovoJogador[];
  ordem: NovoJogador[];
  repetidos: number;
  linhasIgnoradas: number;
};

export type ResultadoAdicionarLista = {
  goleirosAdicionados: number;
  jogadoresAdicionados: number;
  repetidos: number;
};

export type AvisoImportacao = ResultadoAdicionarLista & {
  linhasIgnoradas: number;
};

export type ResultadoColarLista =
  | { sucesso: true; texto: string }
  | { sucesso: false; motivo: "vazia" | "falha" };

export type ResultadoBanco<T> =
  | { sucesso: true; dados: T }
  | { sucesso: false; mensagem: string };

export type DadosHome = {
  futebol: import("./Futebol").Futebol | null;
  jogadores: Jogador[];
  presencas: Record<string, boolean>;
  pagamentosCiclo: Record<string, number>;
  cicloInicio: string | null;
  pagamentosAvulsosJogo: Record<string, number>;
  arrecadacaoAvulsosCicloCentavos: number;
  quantidadePagamentosAvulsosCiclo: number;
};

export type ResultadoAdicaoJogadorBanco = {
  jogador: Jogador | null;
  duplicado: boolean;
  motivo?: import("./Jogador").MotivoFalhaCriacaoJogador;
};

export type PagamentoMensalidade = {
  jogadorId: string;
  cicloInicio: string;
  valorPagoCentavos: number;
  dataMarcacao: string;
};
