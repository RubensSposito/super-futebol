import { create } from "zustand";
import type { Jogador, ResultadoDivisaoTimes } from "@/types";

type ContextoSorteio = {
  jogadores: Jogador[];
  rotulo: string;
  jogadoresPorTime: number | null;
  quantidadeTimes: number | null;
  futebolId?: number | null;
  dataJogo?: string | null;
  sorteioSalvo?: ResultadoDivisaoTimes | null;
};
type SorteioState = ContextoSorteio & {
  preparar: (contexto: ContextoSorteio) => void;
  definirSorteioSalvo: (sorteio: ResultadoDivisaoTimes | null) => void;
  limpar: () => void;
};
export const useSorteioStore = create<SorteioState>((set) => ({
  jogadores: [],
  rotulo: "Partida rápida",
  jogadoresPorTime: null,
  quantidadeTimes: null,
  futebolId: null,
  dataJogo: null,
  sorteioSalvo: null,
  preparar: (contexto) =>
    set({
      futebolId: null,
      dataJogo: null,
      sorteioSalvo: null,
      ...contexto,
    }),
  definirSorteioSalvo: (sorteioSalvo) => set({ sorteioSalvo }),
  limpar: () =>
    set({
      jogadores: [],
      rotulo: "Partida rápida",
      jogadoresPorTime: null,
      quantidadeTimes: null,
      futebolId: null,
      dataJogo: null,
      sorteioSalvo: null,
    }),
}));

