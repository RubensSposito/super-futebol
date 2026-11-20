import { create } from "zustand";
import {
  adicionarJogadorBanco,
  adicionarJogadoresBanco,
  atualizarJogadorBanco,
  carregarDadosHome,
  definirPresenca,
  definirPagamentoMensalidade,
  definirPagamentoAvulso,
  excluirJogadorBanco,
  listarJogadores,
  getFutebolAtivoId,
} from "@/db";
import type {
  DadosHome,
  NovoJogador,
  ResultadoAdicionarLista,
  ResultadoAdicaoJogadorBanco,
  ResultadoBanco,
} from "@/types";
import { validarNovoJogador } from "@/lib/jogadores";
import { obterDataLocal } from "@/lib/datas";

type DadosPersistidosState = {
  futebolAtivoId: number | null;
  dados: DadosHome | null;
  carregando: boolean;
  carregandoPresencas: boolean;
  dataPresencas: string | null;
  presencasPorData: Record<string, Record<string, boolean>>;
  mensagemErro: string | null;
  carregar: (data: string, futebolId?: number) => Promise<boolean>;
  definirFutebolAtivo: (futebolId: number | null) => void;
  marcarPresenca: (
    jogadorId: string,
    data: string,
    presente: boolean,
  ) => Promise<ResultadoBanco<void>>;
  marcarPagamentoMensalidade: (
    jogadorId: string,
    cicloInicio: string,
    valorPagoCentavos: number,
    pago: boolean,
  ) => Promise<ResultadoBanco<void>>;
  marcarPagamentoAvulso: (jogadorId: string, dataJogo: string, valorPagoCentavos: number, pago: boolean) => Promise<ResultadoBanco<void>>;
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
  excluirJogador: (id: string) => Promise<ResultadoBanco<void>>;
  definirErro: (mensagem: string | null) => void;
  limpar: () => void;
};

let sequenciaCarregamento = 0;

export const useDadosPersistidosStore = create<DadosPersistidosState>(
  (set, get) => ({
    futebolAtivoId: null,
    dados: null,
    carregando: false,
    carregandoPresencas: false,
    dataPresencas: null,
    presencasPorData: {},
    mensagemErro: null,
    carregar: async (data, futebolIdInformado) => {
      const sequencia = ++sequenciaCarregamento;
      const futebolId = futebolIdInformado ?? get().futebolAtivoId ?? await getFutebolAtivoId();
      if (futebolId === null) {
        set({ futebolAtivoId: null, dados: null, carregando: false, carregandoPresencas: false, dataPresencas: null, presencasPorData: {}, mensagemErro: null });
        return false;
      }
      const dadosAtuais = get().dados?.futebol?.id === futebolId ? get().dados : null;
      set({
        futebolAtivoId: futebolId,
        carregando: true,
        carregandoPresencas: dadosAtuais !== null,
        dataPresencas: data,
        dados: dadosAtuais
          ? { ...dadosAtuais, presencas: {} }
          : null,
        mensagemErro: null,
      });
      const resultado = await carregarDadosHome(futebolId, data);
      if (sequencia !== sequenciaCarregamento || get().futebolAtivoId !== futebolId) return resultado.sucesso;
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
      const futebolId = get().futebolAtivoId;
      if (futebolId === null) return { sucesso: false, mensagem: "Nenhum futebol está aberto." };
      const resultado = await definirPresenca(futebolId, jogadorId, data, presente);
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
    marcarPagamentoMensalidade: async (
      jogadorId,
      cicloInicio,
      valorPagoCentavos,
      pago,
    ) => {
      const estadoAnterior = get();
      const futebolId = estadoAnterior.futebolAtivoId;
      if (futebolId === null) return { sucesso: false, mensagem: "Nenhum futebol está aberto." };
      const pagamentosAnteriores = estadoAnterior.dados?.pagamentosCiclo ?? {};
      const pagamentosNovos = { ...pagamentosAnteriores };
      if (pago) pagamentosNovos[jogadorId] = valorPagoCentavos;
      else delete pagamentosNovos[jogadorId];
      if (estadoAnterior.dados?.cicloInicio === cicloInicio) {
        set({ dados: { ...estadoAnterior.dados, pagamentosCiclo: pagamentosNovos } });
      }
      const resultado = await definirPagamentoMensalidade(
        futebolId,
        jogadorId,
        cicloInicio,
        valorPagoCentavos,
        pago,
      );
      if (!resultado.sucesso) {
        const dadosAtuais = get().dados;
        if (dadosAtuais?.cicloInicio === cicloInicio) {
          set({
            dados: { ...dadosAtuais, pagamentosCiclo: pagamentosAnteriores },
            mensagemErro: resultado.mensagem,
          });
        }
        return resultado;
      }
      set({ mensagemErro: null });
      return resultado;
    },
    marcarPagamentoAvulso: async (jogadorId, dataJogo, valorPagoCentavos, pago) => {
      const futebolId = get().futebolAtivoId;
      if (futebolId === null) return { sucesso: false, mensagem: "Nenhum futebol está aberto." };
      const resultado = await definirPagamentoAvulso(futebolId, jogadorId, dataJogo, valorPagoCentavos, pago);
      if (resultado.sucesso) await get().carregar(get().dataPresencas ?? dataJogo);
      else set({ mensagemErro: resultado.mensagem });
      return resultado;
    },
    adicionarJogador: async (jogador) => {
      const futebolId = get().futebolAtivoId;
      if (futebolId === null) return { sucesso: false, mensagem: "Nenhum futebol está aberto." };
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
      const resultado = await adicionarJogadorBanco(futebolId, jogador);
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
        await get().carregar(get().dataPresencas ?? obterDataLocal());
      }
      return resultado;
    },
    adicionarVarios: async (jogadores) => {
      const futebolId = get().futebolAtivoId;
      if (futebolId === null) return { sucesso: false, mensagem: "Nenhum futebol está aberto." };
      const resultado = await adicionarJogadoresBanco(futebolId, jogadores);
      if (!resultado.sucesso) {
        set({ mensagemErro: resultado.mensagem });
        return resultado;
      }
      const dados = get().dados;
      if (dados) {
        const jogadoresSalvos = await listarJogadores(futebolId);
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
      const futebolId = get().futebolAtivoId;
      if (futebolId === null) return { sucesso: false, mensagem: "Nenhum futebol está aberto." };
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
      const resultado = await atualizarJogadorBanco(futebolId, id, jogador);
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
    excluirJogador: async (id) => {
      const futebolId = get().futebolAtivoId;
      if (futebolId === null) return { sucesso: false, mensagem: "Nenhum futebol está aberto." };
      const resultado = await excluirJogadorBanco(futebolId, id);
      if (!resultado.sucesso) {
        set({ mensagemErro: resultado.mensagem });
        return resultado;
      }
      const atuais = get().dados;
      if (atuais) {
        const novosJogadores = atuais.jogadores.filter((atual) => atual.id !== id);
        const novasPresencas = { ...atuais.presencas };
        delete novasPresencas[id];
        const novosPagamentosCiclo = { ...atuais.pagamentosCiclo };
        delete novosPagamentosCiclo[id];
        const novosPagamentosAvulso = { ...atuais.pagamentosAvulsosJogo };
        delete novosPagamentosAvulso[id];
        set({
          dados: {
            ...atuais,
            jogadores: novosJogadores,
            presencas: novasPresencas,
            pagamentosCiclo: novosPagamentosCiclo,
            pagamentosAvulsosJogo: novosPagamentosAvulso,
          },
          mensagemErro: null,
        });
      }
      return resultado;
    },
    definirErro: (mensagemErro) => set({ mensagemErro }),
    definirFutebolAtivo: (futebolAtivoId) => set({ futebolAtivoId }),
    limpar: () => {
      sequenciaCarregamento += 1;
      set({
        futebolAtivoId: null,
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
