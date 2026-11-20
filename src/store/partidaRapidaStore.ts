import { create } from "zustand";
import type {
  Jogador,
  NovoJogador,
  ResultadoCriacaoJogador,
  ResultadoAdicionarLista,
  ResultadoLeituraLista,
} from "@/types";
import { criarJogador } from "@/lib/jogadores";

export type ResultadoAdicionarJogador = ResultadoCriacaoJogador;

type PartidaRapidaState = {
  jogadores: Jogador[];
  adicionarJogador: (novoJogador: NovoJogador) => ResultadoAdicionarJogador;
  adicionarVariosJogadores: (
    novosJogadores: Pick<
      ResultadoLeituraLista,
      "goleiros" | "jogadores" | "ordem"
    >,
  ) => ResultadoAdicionarLista;
  limpar: () => void;
};

export const usePartidaRapidaStore = create<PartidaRapidaState>((set, get) => ({
  jogadores: [],
  limpar: () => set({ jogadores: [] }),
  adicionarJogador: (novoJogador) => {
    const resultado = criarJogador(novoJogador, get().jogadores);
    if (!resultado.sucesso) return resultado;

    const { jogador } = resultado;
    set((state) => ({ jogadores: [...state.jogadores, jogador] }));

    return resultado;
  },
  adicionarVariosJogadores: (novosJogadores) => {
    const existentes = get().jogadores;
    const adicionados: Jogador[] = [];
    let goleirosAdicionados = 0;
    let jogadoresAdicionados = 0;
    let repetidos = 0;

    for (const item of novosJogadores.ordem) {
      const resultado = criarJogador(item, [...existentes, ...adicionados]);
      if (!resultado.sucesso) {
        repetidos += 1;
        continue;
      }

      adicionados.push(resultado.jogador);
      if (resultado.jogador.tipo === "goleiro") {
        goleirosAdicionados += 1;
      } else {
        jogadoresAdicionados += 1;
      }
    }

    if (adicionados.length > 0) {
      set((state) => ({ jogadores: [...state.jogadores, ...adicionados] }));
    }

    return {
      goleirosAdicionados,
      jogadoresAdicionados,
      repetidos,
    };
  },
}));

export function selecionarQuantidadeJogadores(
  state: PartidaRapidaState,
): number {
  return state.jogadores.length;
}

export function useQuantidadeJogadores(): number {
  return usePartidaRapidaStore(selecionarQuantidadeJogadores);
}
