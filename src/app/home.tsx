/* eslint-disable react-hooks/set-state-in-effect -- Existing navigation/animation refs or derived UI state are intentionally read in render/effects. */
import { useEffect, useMemo, useState } from "react";
import {
  AppState,
  Alert,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Botao, Texto } from "@/components/atoms";
import {
  FormularioJogadorSheet,
  ImportarListaSheet,
  PainelHome,
} from "@/components/organisms";
import type {
  FiltroPresenca,
  FiltroVinculo,
} from "@/components/organisms";
import { TelaBase } from "@/components/templates";
import {
  dataDentroDosLimites,
  formatarCabecalhoData,
  formatarFaixaStatusJogo,
  deslocarDataLocal,
  obterJogoAtivo,
  obterDataJogoAnterior,
  obterDataJogoSeguinte,
  obterDataLocal,
} from "@/lib/datas";
import { lerListaJogadores } from "@/lib/importacao";
import { normalizarNomeJogador } from "@/lib/jogadores";
import { limparStoresFutebol, useDadosPersistidosStore, useSorteioStore } from "@/store";
import { colors, radii, spacing } from "@/theme";
import type {
  AvisoImportacao,
  Nivel,
  NovoJogador,
  Posicao,
  ResultadoColarLista,
  TipoCadastro,
  TipoJogador,
  Vinculo,
  Jogador,
  ResultadoDivisaoTimes,
} from "@/types";
import { obterSorteioSalvoBanco, resetarDados, setFutebolAtivoId } from "@/db";

const ERRO_NOME_VAZIO = "Informe o nome do jogador.";
const ERRO_NOME_DUPLICADO = "Já existe um jogador com esse nome.";

function determinarTipoJogador(
  tipoCadastro: TipoCadastro | undefined,
  vinculoSelecionado: Vinculo,
): Vinculo | undefined {
  if (tipoCadastro === "basico") return undefined;
  return tipoCadastro === "so_mensalistas" ? "mensalista" : vinculoSelecionado;
}

export default function Home() {
  const router = useRouter();
  const prepararSorteio = useSorteioStore((state) => state.preparar);
  const dados = useDadosPersistidosStore((state) => state.dados);
  const carregando = useDadosPersistidosStore((state) => state.carregando);
  const carregandoPresencas = useDadosPersistidosStore(
    (state) => state.carregandoPresencas,
  );
  const dataPresencas = useDadosPersistidosStore(
    (state) => state.dataPresencas,
  );
  const mensagemErro = useDadosPersistidosStore((state) => state.mensagemErro);
  const carregar = useDadosPersistidosStore((state) => state.carregar);
  const marcarPresenca = useDadosPersistidosStore(
    (state) => state.marcarPresenca,
  );
  const marcarPagamentoMensalidade = useDadosPersistidosStore(
    (state) => state.marcarPagamentoMensalidade,
  );
  const marcarPagamentoAvulso = useDadosPersistidosStore((state) => state.marcarPagamentoAvulso);
  const adicionarJogador = useDadosPersistidosStore(
    (state) => state.adicionarJogador,
  );
  const adicionarVarios = useDadosPersistidosStore(
    (state) => state.adicionarVarios,
  );
  const editarJogador = useDadosPersistidosStore(
    (state) => state.editarJogador,
  );
  const excluirJogador = useDadosPersistidosStore(
    (state) => state.excluirJogador,
  );
  const limparDados = useDadosPersistidosStore((state) => state.limpar);
  const definirErro = useDadosPersistidosStore((state) => state.definirErro);
  const [hoje, setHoje] = useState(obterDataLocal);
  const [data, setData] = useState(hoje);
  const [filtro, setFiltro] = useState<FiltroPresenca>("todos");
  const [filtroVinculo, setFiltroVinculo] =
    useState<FiltroVinculo>("todos");
  const [formularioVisivel, setFormularioVisivel] = useState(false);
  const [importacaoVisivel, setImportacaoVisivel] = useState(false);
  const [avisoImportacao, setAvisoImportacao] =
    useState<AvisoImportacao | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoJogador>("linha");
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [nivel, setNivel] = useState<Nivel | null>(null);
  const [vinculo, setVinculo] = useState<Vinculo>("mensalista");
  const [jogadorEmEdicao, setJogadorEmEdicao] = useState<string | null>(null);
  const [adicionandoAvulso, setAdicionandoAvulso] = useState(false);
  const [avulsoDuplicadoId, setAvulsoDuplicadoId] = useState<string | null>(null);
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [sorteioSalvoData, setSorteioSalvoData] =
    useState<ResultadoDivisaoTimes | null>(null);

  useEffect(() => {
    let cancelado = false;
    async function checarSorteio() {
      if (!dados?.futebol?.id) {
        setSorteioSalvoData(null);
        return;
      }
      const res = await obterSorteioSalvoBanco(dados.futebol.id, data);
      if (!cancelado) {
        setSorteioSalvoData(res.sucesso ? res.dados : null);
      }
    }
    void checarSorteio();
    return () => {
      cancelado = true;
    };
  }, [dados?.futebol?.id, data]);

  useEffect(() => {
    void carregar(data);
  }, [carregar, data, hoje]);

  useEffect(() => {
    const atualizarHoje = () => setHoje(obterDataLocal());
    const assinatura = AppState.addEventListener("change", (estado) => {
      if (estado === "active") atualizarHoje();
    });
    const intervalo = setInterval(atualizarHoje, 10_000);
    return () => {
      assinatura.remove();
      clearInterval(intervalo);
    };
  }, []);

  const jogadoresVisiveis = useMemo(() => {
    if (!dados || filtro === "todos") return dados?.jogadores ?? [];
    return dados.jogadores.filter((jogador) => {
      const presente = dados.presencas[jogador.id] ?? false;
      return filtro === "presentes" ? presente : !presente;
    });
  }, [dados, filtro]);

  const totalPresentes = useMemo(
    () =>
      dados?.jogadores.reduce(
        (total, jogador) =>
          total + (dados.presencas[jogador.id] === true ? 1 : 0),
        0,
      ) ?? 0,
    [dados],
  );
  const futebol = dados?.futebol;
  const diasSemana = futebol?.diasSemana ?? [];
  useEffect(() => {
    const controlaMensalistas =
      futebol?.controlePagamento === "mensalistas" || futebol?.controlePagamento === "ambos";
    if (!futebol?.controlaPresenca) setFiltro("todos");
    if (!controlaMensalistas ||
      (futebol?.tipoCadastro !== "mensalistas_e_avulsos" && filtroVinculo !== "pendentes")) {
      setFiltroVinculo("todos");
    }
  }, [futebol?.controlaPresenca, futebol?.tipoCadastro, futebol?.controlePagamento, filtroVinculo]);

  const dataJogoAtivo =
    futebol?.controlaPresenca
      ? obterJogoAtivo(hoje, diasSemana)
      : hoje;
  useEffect(() => {
    setData(dataJogoAtivo);
  }, [dataJogoAtivo]);
  const dataAnterior = futebol
    ? obterDataJogoAnterior(data, diasSemana)
    : deslocarDataLocal(data, -1);
  const dataSeguinte = futebol
    ? obterDataJogoSeguinte(data, diasSemana)
    : deslocarDataLocal(data, 1);
  const podeIrAnterior =
    futebol != null &&
    dataDentroDosLimites(dataAnterior, futebol.dataCriacao, hoje);
  const podeIrSeguinte =
    futebol != null &&
    dataDentroDosLimites(dataSeguinte, futebol.dataCriacao, hoje);
  const presencasCarregando =
    carregandoPresencas || dataPresencas !== data;
  const situacaoData =
    data < dataJogoAtivo
      ? "Jogo passado"
      : data === dataJogoAtivo
        ? dataJogoAtivo === hoje
          ? "Hoje"
          : "Próximo jogo"
        : "Próximo jogo";
  const rotuloHoje = dataJogoAtivo === hoje ? "Hoje" : "Próximo jogo";
  const statusJogoTexto = formatarFaixaStatusJogo(
    data,
    hoje,
    diasSemana,
    futebol?.horario ?? null,
  );

  function navegarData(direcao: -1 | 1) {
    if (!futebol) return;
    setData((atual) => {
      const candidata =
        direcao < 0
          ? obterDataJogoAnterior(atual, futebol.diasSemana)
          : obterDataJogoSeguinte(atual, futebol.diasSemana);
      return dataDentroDosLimites(candidata, futebol.dataCriacao, hoje)
        ? candidata
        : atual;
    });
  }

  function voltarParaDataInicial() {
    setData(dataJogoAtivo);
  }

  function limparFormulario() {
    setNome("");
    setTipo("linha");
    setPosicao(null);
    setNivel(null);
    setVinculo("mensalista");
    setJogadorEmEdicao(null);
    setAdicionandoAvulso(false);
    setAvulsoDuplicadoId(null);
    setErroNome(null);
    setErroFormulario(null);
  }

  function fecharFormulario() {
    setFormularioVisivel(false);
    limparFormulario();
  }

  function iniciarEdicao(jogador: Jogador) {
    setNome(jogador.nome);
    setTipo(jogador.tipo);
    setPosicao(jogador.tipo === "goleiro" ? null : jogador.posicao ?? null);
    setNivel(jogador.nivel ?? null);
    setVinculo(jogador.vinculo ?? "mensalista");
    setJogadorEmEdicao(jogador.id);
    setErroNome(null);
    setErroFormulario(null);
    setFormularioVisivel(true);
  }

  function confirmarExclusaoJogador() {
    if (!jogadorEmEdicao) return;
    const jogador = dados?.jogadores.find((j) => j.id === jogadorEmEdicao);
    const nomeJogador = jogador?.nome ?? nome;
    Alert.alert(
      "Excluir jogador?",
      `Deseja remover “${nomeJogador}”? O histórico de presenças dele neste futebol será apagado. Essa ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir jogador",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const idParaExcluir = jogadorEmEdicao;
              fecharFormulario();
              const resultado = await excluirJogador(idParaExcluir);
              if (!resultado.sucesso) {
                Alert.alert("Erro ao excluir", resultado.mensagem);
              } else {
                setMensagemSucesso(`Jogador “${nomeJogador}” excluído.`);
              }
            })();
          },
        },
      ],
    );
  }

  async function salvarJogador(continuarAdicionando = false) {
    if (!dados) return;
    const vinculoAplicavel = determinarTipoJogador(
      dados.futebol?.tipoCadastro,
      vinculo,
    );
    const novoJogador: NovoJogador = {
      nome,
      tipo,
      ...(tipo === "goleiro"
        ? { posicao: "goleiro" }
        : posicao
          ? { posicao }
          : {}),
      ...(nivel ? { nivel } : {}),
      ...(vinculoAplicavel ? { vinculo: vinculoAplicavel } : {}),
    };
    const resultado = jogadorEmEdicao
      ? await editarJogador(jogadorEmEdicao, novoJogador)
      : await adicionarJogador(novoJogador);
    if (!resultado.sucesso) {
      setErroFormulario(resultado.mensagem);
      return;
    }
    if (resultado.dados.motivo === "nome_duplicado") {
      const existente = dados.jogadores.find((j) => normalizarNomeJogador(j.nome) === normalizarNomeJogador(nome));
      if (adicionandoAvulso && existente?.vinculo === "avulso") {
        setAvulsoDuplicadoId(existente.id);
        setErroNome(null);
        return;
      }
      setErroNome(ERRO_NOME_DUPLICADO);
      return;
    }
    if (resultado.dados.motivo === "nome_vazio") {
      setErroNome(ERRO_NOME_VAZIO);
      return;
    }
    if (resultado.dados.motivo) {
      setErroFormulario("Confira o tipo e a posição do jogador.");
      return;
    }
    setAvisoImportacao(null);
    if (adicionandoAvulso && resultado.dados.jogador) {
      const id = resultado.dados.jogador.id;
      const nomeAvulso = resultado.dados.jogador.nome;
      const chamada = await marcarPresenca(id, data, true);
      if (!chamada.sucesso) { setErroFormulario(chamada.mensagem); return; }
      if (chamada.sucesso && (dados.futebol?.controlePagamento === "avulsos" || dados.futebol?.controlePagamento === "ambos")) {
        const valor = dados.futebol.avulsoEscolhidoCentavos ?? dados.futebol.avulsoSugeridoCentavos ?? 0;
        const pagamento = await marcarPagamentoAvulso(id, data, valor, true);
        if (!pagamento.sucesso) { setErroFormulario(pagamento.mensagem); return; }
      }
      // Recarrega dados para garantir que o avulso aparece na lista e o saldo é atualizado
      await carregar(data);
      if (continuarAdicionando) {
        setNome(""); setTipo("linha"); setPosicao(null); setNivel(null); setErroNome(null); setErroFormulario(null); setAvulsoDuplicadoId(null);
        setMensagemSucesso(`${nomeAvulso} adicionado ao jogo! ✓`);
        setTimeout(() => setMensagemSucesso(null), 3000);
        return;
      }
      setMensagemSucesso(`${nomeAvulso} adicionado ao jogo! ✓`);
      setTimeout(() => setMensagemSucesso(null), 3000);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    fecharFormulario();
  }

  async function salvarAvulso(continuar: boolean) { await salvarJogador(continuar); }

  async function chamarAvulsoDuplicado() {
    if (!avulsoDuplicadoId || !dados?.futebol) return;
    const jogadorAvulso = dados.jogadores.find((j) => j.id === avulsoDuplicadoId);
    const chamado = await marcarPresenca(avulsoDuplicadoId, data, true);
    if (!chamado.sucesso) { setErroFormulario(chamado.mensagem); return; }
    if (chamado.sucesso && (dados.futebol.controlePagamento === "avulsos" || dados.futebol.controlePagamento === "ambos")) {
      const valor = dados.futebol.avulsoEscolhidoCentavos ?? dados.futebol.avulsoSugeridoCentavos ?? 0;
      const pagamento = await marcarPagamentoAvulso(avulsoDuplicadoId, data, valor, true);
      if (!pagamento.sucesso) Alert.alert("Não foi possível salvar", pagamento.mensagem);
    }
    if (jogadorAvulso) {
      setMensagemSucesso(`${jogadorAvulso.nome} adicionado ao jogo! ✓`);
      setTimeout(() => setMensagemSucesso(null), 3000);
      await carregar(data);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    fecharFormulario();
  }

  async function importarLista(
    texto: string,
    vinculoEscolhido?: Vinculo,
  ): Promise<boolean> {
    if (!dados) return false;
    const vinculoImportado = determinarTipoJogador(
      dados.futebol?.tipoCadastro,
      vinculoEscolhido ?? "mensalista",
    );
    const leitura = lerListaJogadores(texto, dados.jogadores, vinculoImportado);
    if (leitura.ordem.length === 0) {
      if (leitura.repetidos === 0) return false;
      setAvisoImportacao({
        goleirosAdicionados: 0,
        jogadoresAdicionados: 0,
        repetidos: leitura.repetidos,
        linhasIgnoradas: leitura.linhasIgnoradas,
      });
      return true;
    }

    const resultado = await adicionarVarios(leitura.ordem);
    if (!resultado.sucesso) {
      Alert.alert("Não foi possível importar", resultado.mensagem);
      return true;
    }
    setAvisoImportacao({
      ...resultado.dados,
      repetidos: resultado.dados.repetidos + leitura.repetidos,
      linhasIgnoradas: leitura.linhasIgnoradas,
    });
    return true;
  }

  async function colarLista(): Promise<ResultadoColarLista> {
    try {
      const texto = await Clipboard.getStringAsync();
      return texto.trim()
        ? { sucesso: true, texto }
        : { sucesso: false, motivo: "vazia" };
    } catch {
      return { sucesso: false, motivo: "falha" };
    }
  }

  function confirmarReset() {
    if (!__DEV__) return;
    Alert.alert(
      "Apagar dados de desenvolvimento?",
      "Esta ação remove o cadastro e as presenças salvos neste aparelho.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar dados",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const resultado = await resetarDados();
              if (!resultado.sucesso) {
                Alert.alert("Não foi possível apagar", resultado.mensagem);
                definirErro(resultado.mensagem);
                return;
              }
              limparStoresFutebol();
              limparDados();
              router.replace("/onboarding");
            })();
          },
        },
      ],
    );
  }

  const dataLabel = formatarCabecalhoData(data);

  return (
    <TelaBase contentStyle={styles.conteudo}>
      {dados?.futebol ? (
        <View style={styles.acoes}>
          <Botao
            variante="primario"
            accessibilityLabel="Adicionar jogador"
            onPress={() => {
              setAvisoImportacao(null);
              setMensagemSucesso(null);
              setFormularioVisivel(true);
            }}
          >
            Adicionar jogador
          </Botao>
          {dados.futebol.tipoCadastro === "mensalistas_e_avulsos" ? <Botao variante="secundario" accessibilityLabel="Adicionar avulso ao jogo" onPress={() => { limparFormulario(); setMensagemSucesso(null); setAdicionandoAvulso(true); setVinculo("avulso"); setFormularioVisivel(true); }}>Adicionar avulso</Botao> : null}
          <Botao
            variante="secundario"
            accessibilityLabel="Importar lista de jogadores"
            onPress={() => {
              setAvisoImportacao(null);
              setMensagemSucesso(null);
              setImportacaoVisivel(true);
            }}
          >
            Importar lista
          </Botao>
        </View>
      ) : null}
      {mensagemSucesso ? (
        <Texto variante="corpo" cor="primary" style={styles.mensagemSucesso}>
          {mensagemSucesso}
        </Texto>
      ) : null}
      {carregando && !dados ? (
        <Texto variante="corpo">Carregando dados salvos...</Texto>
      ) : dados?.futebol ? (
        <>
          <PainelHome
            dados={dados}
            avisoImportacao={avisoImportacao}
            dataLabel={dataLabel}
            situacaoData={situacaoData}
            statusJogoTexto={statusJogoTexto}
            rotuloHoje={rotuloHoje}
            mostrarAvisoHojeNaoEhJogo={
              dataJogoAtivo !== hoje && data === dataJogoAtivo
            }
            presencasCarregando={presencasCarregando}
            podeIrAnterior={podeIrAnterior}
            podeIrSeguinte={podeIrSeguinte}
            filtro={filtro}
            filtroVinculo={filtroVinculo}
            jogadoresVisiveis={jogadoresVisiveis}
            totalPresentes={totalPresentes}
            dataReferencia={hoje}
            onDataChange={(deslocamento) =>
              navegarData(deslocamento < 0 ? -1 : 1)
            }
            onHoje={voltarParaDataInicial}
            onFiltroChange={setFiltro}
            onFiltroVinculoChange={setFiltroVinculo}
            onPresencaChange={(jogadorId, presente) => {
              void marcarPresenca(jogadorId, data, presente).then(async (resultado) => {
                if (!resultado.sucesso) { Alert.alert("Não foi possível salvar", resultado.mensagem); return; }
                const jogador = dados.jogadores.find((item) => item.id === jogadorId);
                const controlaAvulsos = dados.futebol?.controlePagamento === "avulsos" || dados.futebol?.controlePagamento === "ambos";
                if (jogador?.vinculo === "avulso" && controlaAvulsos) {
                  const valor = dados.futebol?.avulsoEscolhidoCentavos ?? dados.futebol?.avulsoSugeridoCentavos ?? 0;
                  const pagamento = await marcarPagamentoAvulso(jogadorId, data, valor, presente);
                  if (!pagamento.sucesso) Alert.alert("Não foi possível salvar", pagamento.mensagem);
                }
              });
            }}
            onPagamentoChange={(jogadorId, pago) => {
              const jogador = dados.jogadores.find((item) => item.id === jogadorId);
              if (jogador?.vinculo === "avulso") {
                const valor = dados.futebol?.avulsoEscolhidoCentavos ?? dados.futebol?.avulsoSugeridoCentavos ?? 0;
                void marcarPagamentoAvulso(jogadorId, data, valor, pago).then((resultado) => {
                  if (!resultado.sucesso) Alert.alert("Não foi possível salvar", resultado.mensagem);
                });
                return;
              }
              const mensalidade = dados.futebol?.mensalidadeCentavos ?? 0;
              const ciclo = dados.cicloInicio;
              if (!ciclo) return;
              void marcarPagamentoMensalidade(
                jogadorId,
                ciclo,
                mensalidade,
                pago,
              ).then((resultado) => {
                if (!resultado.sucesso) {
                  Alert.alert("Não foi possível salvar", resultado.mensagem);
                }
              });
            }}
            onEditarJogador={iniciarEdicao}
            onSair={() => { const nomeSaida = dados.futebol?.nome ?? ""; void (async () => { await setFutebolAtivoId(null); limparStoresFutebol(); router.dismissAll(); router.replace({ pathname: "/futebols", params: { saiu: nomeSaida } }); })(); }}
            onEditarFutebol={() =>
              router.push({
                pathname: "/cadastro-futebol",
                params: { modo: "edicao" },
              })
            }
            sorteioSalvo={sorteioSalvoData}
            onAbrirTimes={() => {
              const jogadoresSorteio = dados.futebol?.controlaPresenca
                ? dados.jogadores.filter((j) => dados.presencas[j.id] === true)
                : dados.jogadores;
              prepararSorteio({
                jogadores: jogadoresSorteio.length > 0 ? jogadoresSorteio : (sorteioSalvoData ? [...sorteioSalvoData.times.flatMap(t => [...(t.goleiro ? [t.goleiro] : []), ...t.jogadoresLinha]), ...sorteioSalvoData.reservas] : []),
                rotulo: dados.futebol?.nome ?? `Jogo de ${formatarCabecalhoData(data)}`,
                jogadoresPorTime: dados.futebol?.jogadoresPorTime ?? null,
                quantidadeTimes: dados.futebol?.quantidadeTimes ?? null,
                futebolId: dados.futebol?.id ?? null,
                dataJogo: data,
                sorteioSalvo: sorteioSalvoData,
              });
              router.push("/resultado");
            }}
          />
          {(() => {
            const jogadoresSorteio = dados.futebol?.controlaPresenca
              ? dados.jogadores.filter((j) => dados.presencas[j.id] === true)
              : dados.jogadores;

            function abrirSorteio() {
              prepararSorteio({
                jogadores:
                  jogadoresSorteio.length > 0
                    ? jogadoresSorteio
                    : sorteioSalvoData
                      ? [
                          ...sorteioSalvoData.times.flatMap((t) => [
                            ...(t.goleiro ? [t.goleiro] : []),
                            ...t.jogadoresLinha,
                          ]),
                          ...sorteioSalvoData.reservas,
                        ]
                      : [],
                rotulo: dados?.futebol?.nome ?? `Jogo de ${formatarCabecalhoData(data)}`,
                jogadoresPorTime: dados?.futebol?.jogadoresPorTime ?? null,
                quantidadeTimes: dados?.futebol?.quantidadeTimes ?? null,
                futebolId: dados?.futebol?.id ?? null,
                dataJogo: data,
                sorteioSalvo: sorteioSalvoData,
              });
              router.push("/resultado");
            }

            return (
              <View style={styles.rodapeSorteio}>
                <Botao
                  variante="primario"
                  accessibilityLabel={
                    sorteioSalvoData
                      ? `Ver times sorteados (${sorteioSalvoData.times.length} times)`
                      : `Sortear times com ${jogadoresSorteio.length} jogadores`
                  }
                  desabilitado={!sorteioSalvoData && jogadoresSorteio.length < 2}
                  onPress={abrirSorteio}
                >
                  {sorteioSalvoData
                    ? `⚽ Ver / alterar times (${sorteioSalvoData.times.length} times)`
                    : `🎲 Sortear times (${jogadoresSorteio.length} jogadores)`}
                </Botao>
                {!sorteioSalvoData && jogadoresSorteio.length < 2 ? (
                  <Texto variante="legenda">
                    Confirme pelo menos 2 jogadores para sortear.
                  </Texto>
                ) : null}
              </View>
            );
          })()}
        </>
      ) : (
        <View style={styles.erroCarregamento}>
          <Texto variante="corpo">
            {mensagemErro ??
              (dados
                ? "A configuração do futebol não foi encontrada."
                : "Não foi possível carregar os dados salvos.")}
          </Texto>
          <Botao
            variante="secundario"
            accessibilityLabel="Tentar carregar os dados novamente"
            onPress={() => void carregar(data)}
          >
            Tentar novamente
          </Botao>
        </View>
      )}
      {mensagemErro && dados ? (
        <Texto variante="legenda" cor="error">
          {mensagemErro}
        </Texto>
      ) : null}
      {__DEV__ ? (
        <Botao
          variante="secundario"
          accessibilityLabel="Apagar dados de desenvolvimento"
          onPress={confirmarReset}
        >
          Apagar dados de desenvolvimento
        </Botao>
      ) : null}
      <FormularioJogadorSheet
        visivel={formularioVisivel}
        modo={jogadorEmEdicao ? "edicao" : "criacao"}
        nome={nome}
        tipo={tipo}
        posicao={posicao}
        nivel={nivel}
        vinculo={adicionandoAvulso ? "avulso" : vinculo}
        mostrarVinculo={adicionandoAvulso ? false : dados?.futebol?.tipoCadastro === "mensalistas_e_avulsos"}
        titulo={adicionandoAvulso ? `Adicionar avulso ao jogo de ${formatarCabecalhoData(data)}` : undefined}
        rotuloSalvar={adicionandoAvulso ? "Adicionar ao jogo" : undefined}
        onSalvarContinuar={adicionandoAvulso ? () => void salvarAvulso(true) : undefined}
        onChamarDuplicado={avulsoDuplicadoId ? () => void chamarAvulsoDuplicado() : undefined}
        erroNome={erroNome}
        onNomeChange={(valor) => {
          setNome(valor);
          setErroNome(null);
        }}
        erroFormulario={erroFormulario}
        mensagemSucesso={formularioVisivel ? mensagemSucesso : null}
        onTipoChange={(valor) => {
          setTipo(valor);
          setPosicao(valor === "goleiro" ? "goleiro" : null);
        }}
        onPosicaoChange={setPosicao}
        onNivelChange={setNivel}
        onVinculoChange={setVinculo}
        onSalvar={() => void (adicionandoAvulso ? salvarAvulso(false) : salvarJogador())}
        onCancelar={fecharFormulario}
        onExcluir={jogadorEmEdicao ? confirmarExclusaoJogador : undefined}
      />
      <ImportarListaSheet
        visivel={importacaoVisivel}
        tipoCadastro={dados?.futebol?.tipoCadastro}
        onCancelar={() => setImportacaoVisivel(false)}
        onImportar={importarLista}
        onColar={colarLista}
      />
    </TelaBase>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flex: 1,
    gap: spacing.xl,
  },
  acoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  rodapeSorteio: { gap: spacing.sm, paddingBottom: spacing.md },
  erroCarregamento: {
    gap: spacing.md,
  },
  mensagemSucesso: {
    backgroundColor: colors.successBackground,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlign: "center",
  },
});
