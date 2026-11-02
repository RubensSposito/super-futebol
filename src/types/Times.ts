import type { Jogador } from "./Jogador";

export type TimeFormado = {
  numero: number;
  goleiro?: Jogador;
  vagaExtraGoleiro: boolean;
  jogadoresLinha: Jogador[];
};

export type TotaisDivisao = {
  jogadores: number;
  goleiros: number;
  jogadoresLinha: number;
  reservas: number;
};

export type ResultadoDivisaoTimes = {
  times: TimeFormado[];
  reservas: Jogador[];
  N: number;
  T: number;
  R: number;
  totais: TotaisDivisao;
  motivo: "jogadores insuficientes" | null;
};
