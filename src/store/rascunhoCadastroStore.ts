import { create } from "zustand";
import type {
  Futebol,
  Jogador,
  NovoJogador,
  ResultadoAdicionarLista,
  ResultadoCriacaoJogador,
  ResultadoEdicaoJogador,
  ResultadoLeituraLista,
  RascunhoFutebol,
} from "@/types";
import { criarJogador, validarNovoJogador } from "@/lib/jogadores";

type RascunhoCadastroState = {
  futebol: RascunhoFutebol | null;
  jogadores: Jogador[];
  salvarFutebol: (futebol: RascunhoFutebol) => void;
  adicionarJogador: (jogador: NovoJogador) => ResultadoCriacaoJogador;
  adicionarVarios: (
    leitura: Pick<ResultadoLeituraLista, "ordem">,
  ) => ResultadoAdicionarLista;
  editarJogador: (
    id: string,
    jogador: NovoJogador,
  ) => ResultadoEdicaoJogador;
  limpar: () => void;
};

export const useRascunhoCadastroStore = create<RascunhoCadastroState>(
  (set, get) => ({
    futebol: null,
    jogadores: [],
    salvarFutebol: (futebol) => set({ futebol }),
    adicionarJogador: (novoJogador) => {
      const resultado = criarJogador(novoJogador, get().jogadores);
      if (resultado.sucesso) {
        set((state) => ({ jogadores: [...state.jogadores, resultado.jogador] }));
      }
      return resultado;
    },
    adicionarVarios: (leitura) => {
      const atuais = get().jogadores;
      const novos: Jogador[] = [];
      let goleirosAdicionados = 0;
      let jogadoresAdicionados = 0;
      let repetidos = 0;

      for (const jogador of leitura.ordem) {
        const resultado = criarJogador(jogador, [...atuais, ...novos]);
        if (!resultado.sucesso) {
          repetidos += 1;
          continue;
        }
        novos.push(resultado.jogador);
        if (resultado.jogador.tipo === "goleiro") {
          goleirosAdicionados += 1;
        } else {
          jogadoresAdicionados += 1;
        }
      }

      if (novos.length > 0) {
        set((state) => ({ jogadores: [...state.jogadores, ...novos] }));
      }
      return { goleirosAdicionados, jogadoresAdicionados, repetidos };
    },
    editarJogador: (id, novoJogador) => {
      const jogadorAtual = get().jogadores.find((jogador) => jogador.id === id);
      if (!jogadorAtual) {
        return { sucesso: false, motivo: "jogador_nao_encontrado" };
      }
      const validacao = validarNovoJogador(
        novoJogador,
        get().jogadores,
        id,
      );
      if (!validacao.valido) {
        return { sucesso: false, motivo: validacao.motivo };
      }
      const atualizado: Jogador = {
        id,
        nome: validacao.nome,
        tipo: novoJogador.tipo,
        posicao:
          novoJogador.tipo === "goleiro" ? "goleiro" : novoJogador.posicao,
        ...(novoJogador.nivel ? { nivel: novoJogador.nivel } : {}),
        ...(novoJogador.vinculo ? { vinculo: novoJogador.vinculo } : {}),
      };
      set((state) => ({
        jogadores: state.jogadores.map((jogador) =>
          jogador.id === id ? atualizado : jogador,
        ),
      }));
      return { sucesso: true, jogador: atualizado };
    },
    limpar: () => set({ futebol: null, jogadores: [] }),
  }),
);

export function criarFutebolDoRascunho(
  rascunho: RascunhoFutebol,
  dataCriacao: string,
): Futebol {
  return { ...rascunho, dataCriacao };
}
