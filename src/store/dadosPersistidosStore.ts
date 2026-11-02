import { create } from "zustand";
import {
  adicionarJogadorBanco,
  adicionarJogadoresBanco,
  atualizarJogadorBanco,
  carregarDadosHome,
  definirPresenca,
  listarJogadores,
} from "@/db";
import type {
  DadosHome,
  NovoJogador,
  ResultadoAdicionarLista,
  ResultadoAdicaoJogadorBanco,
  ResultadoBanco,
} from "@/types";
import { validarNovoJogador } from "@/lib/jogadores";

type DadosPersistidosState = {
  dados: DadosHome | null;
  carregando: boolean;
  carregandoPresencas: boolean;
  dataPresencas: string | null;
  presencasPorData: Record<string, Record<string, boolean>>;
  mensagemErro: string | null;
  carregar: (data: string) => Promise<boolean>;
  marcarPresenca: (
    jogadorId: string,
    data: string,
    presente: boolean,
  ) => Promise<ResultadoBanco<void>>;
  adicionarJogador: (
    jogador: NovoJogador,
  ) => Promise<ResultadoBanco<ResultadoAdicaoJogadorBanco>>;
  adicionarVarios: (
    jogadores: readonly NovoJogador[],
  ) => Promise<ResultadoBanco<ResultadoAdicionarLista>>;
  editarJogador: (
    id: string,
    jogador: NovoJogador,
  ) => Promise<ResultadoBanco<ResultadoAdicaoJogadorBanco>>;
  definirErro: (mensagem: string | null) => void;
  limpar: () => void;
};

let sequenciaCarregamento = 0;

export const useDadosPersistidosStore = create<DadosPersistidosState>(
  (set, get) => ({
    dados: null,
    carregando: false,
    carregandoPresencas: false,
    dataPresencas: null,
    presencasPorData: {},
    mensagemErro: null,
    carregar: async (data) => {
      const sequencia = ++sequenciaCarregamento;
      const dadosAtuais = get().dados;
      set({
        carregando: true,
        carregandoPresencas: dadosAtuais !== null,
        dataPresencas: data,
        dados: dadosAtuais
          ? { ...dadosAtuais, presencas: {} }
          : null,
        mensagemErro: null,
      });
      const resultado = await carregarDadosHome(data);
      if (sequencia !== sequenciaCarregamento) return resultado.sucesso;
      if (!resultado.sucesso) {
        set({
          carregando: false,
          carregandoPresencas: false,
          mensagemErro: resultado.mensagem,
        });
        return false;
      }
      const presencasSalvas =
        get().presencasPorData[data] ?? resultado.dados.presencas;
      const presencas = {
        ...resultado.dados.presencas,
        ...presencasSalvas,
      };
      set({
        dados: { ...resultado.dados, presencas },
        carregando: false,
        carregandoPresencas: false,
        dataPresencas: data,
        presencasPorData: {
          ...get().presencasPorData,
          [data]: presencas,
        },
        mensagemErro: null,
      });
      return true;
    },
    marcarPresenca: async (jogadorId, data, presente) => {
      const resultado = await definirPresenca(jogadorId, data, presente);
      if (!resultado.sucesso) {
        if (get().dataPresencas === data) {
          set({ mensagemErro: resultado.mensagem });
        }
        return resultado;
      }
      const estado = get();
      const presencas = {
        ...(estado.presencasPorData[data] ?? {}),
        [jogadorId]: presente,
      };
      if (estado.dados && estado.dataPresencas === data) {
        set({
          dados: {
            ...estado.dados,
            presencas: { ...estado.dados.presencas, [jogadorId]: presente },
          },
          presencasPorData: {
            ...estado.presencasPorData,
            [data]: presencas,
          },
          mensagemErro: null,
        });
      } else {
        set({
          presencasPorData: {
            ...estado.presencasPorData,
            [data]: presencas,
          },
        });
      }
      return resultado;
    },
    adicionarJogador: async (jogador) => {
      const existentes = get().dados?.jogadores ?? [];
      const validacao = validarNovoJogador(jogador, existentes);
      if (!validacao.valido) {
        return {
          sucesso: true,
          dados: {
            jogador: null,
            duplicado: validacao.motivo === "nome_duplicado",
            motivo: validacao.motivo,
          },
        };
      }
      const resultado = await adicionarJogadorBanco(jogador);
      if (!resultado.sucesso) {
        set({ mensagemErro: resultado.mensagem });
        return resultado;
      }
      if (resultado.dados.jogador) {
        const dados = get().dados;
        if (dados) {
          set({
            dados: {
              ...dados,
              jogadores: [...dados.jogadores, resultado.dados.jogador],
            },
            mensagemErro: null,
          });
        }
      }
      return resultado;
    },
    adicionarVarios: async (jogadores) => {
      const resultado = await adicionarJogadoresBanco(jogadores);
      if (!resultado.sucesso) {
        set({ mensagemErro: resultado.mensagem });
        return resultado;
      }
      const dados = get().dados;
      if (dados) {
        const jogadoresSalvos = await listarJogadores();
        if (jogadoresSalvos.sucesso) {
          set({
            dados: { ...dados, jogadores: jogadoresSalvos.dados },
            mensagemErro: null,
          });
        } else {
          set({ mensagemErro: jogadoresSalvos.mensagem });
        }
      }
      return resultado;
    },
    editarJogador: async (id, jogador) => {
      const dados = get().dados;
      const validacao = validarNovoJogador(
        jogador,
        dados?.jogadores ?? [],
        id,
      );
      if (!validacao.valido) {
        return {
          sucesso: true,
          dados: {
            jogador: null,
            duplicado: validacao.motivo === "nome_duplicado",
            motivo: validacao.motivo,
          },
        };
      }
      const resultado = await atualizarJogadorBanco(id, jogador);
      if (!resultado.sucesso) {
        set({ mensagemErro: resultado.mensagem });
        return resultado;
      }
      const jogadorAtualizado = resultado.dados.jogador;
      if (jogadorAtualizado) {
        const atuais = get().dados;
        if (atuais) {
          set({
            dados: {
              ...atuais,
              jogadores: atuais.jogadores.map((atual) =>
                atual.id === id ? jogadorAtualizado : atual,
              ),
            },
            mensagemErro: null,
          });
        }
      }
      return resultado;
    },
    definirErro: (mensagemErro) => set({ mensagemErro }),
    limpar: () => {
      sequenciaCarregamento += 1;
    set({
      dados: null,
      carregando: false,
      carregandoPresencas: false,
      dataPresencas: null,
      presencasPorData: {},
      mensagemErro: null,
    });
    },
  }),
);
