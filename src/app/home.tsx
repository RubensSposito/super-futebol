import { useEffect, useMemo, useRef, useState } from "react";
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
import { useDadosPersistidosStore } from "@/store";
import { spacing } from "@/theme";
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
} from "@/types";
import { resetarDados } from "@/db";

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
  const adicionarJogador = useDadosPersistidosStore(
    (state) => state.adicionarJogador,
  );
  const adicionarVarios = useDadosPersistidosStore(
    (state) => state.adicionarVarios,
  );
  const editarJogador = useDadosPersistidosStore(
    (state) => state.editarJogador,
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
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoJogador>("linha");
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [nivel, setNivel] = useState<Nivel | null>(null);
  const [vinculo, setVinculo] = useState<Vinculo>("mensalista");
  const [jogadorEmEdicao, setJogadorEmEdicao] = useState<string | null>(null);
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  useEffect(() => {
    void carregar(data);
  }, [carregar, data]);

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
    if (!futebol?.controlaPresenca) setFiltro("todos");
    if (futebol?.tipoCadastro !== "mensalistas_e_avulsos") {
      setFiltroVinculo("todos");
    }
  }, [futebol?.controlaPresenca, futebol?.tipoCadastro]);

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

  async function salvarJogador() {
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
              setFormularioVisivel(true);
            }}
          >
            Adicionar jogador
          </Botao>
          <Botao
            variante="secundario"
            accessibilityLabel="Importar lista de jogadores"
            onPress={() => {
              setAvisoImportacao(null);
              setImportacaoVisivel(true);
            }}
          >
            Importar lista
          </Botao>
        </View>
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
            onDataChange={(deslocamento) =>
              navegarData(deslocamento < 0 ? -1 : 1)
            }
            onHoje={voltarParaDataInicial}
            onFiltroChange={setFiltro}
            onFiltroVinculoChange={setFiltroVinculo}
            onPresencaChange={(jogadorId, presente) => {
              void marcarPresenca(jogadorId, data, presente).then(
                (resultado) => {
                  if (!resultado.sucesso) {
                    Alert.alert("Não foi possível salvar", resultado.mensagem);
                  }
                },
              );
            }}
            onEditarJogador={iniciarEdicao}
            onEditarFutebol={() =>
              router.push({
                pathname: "/cadastro-futebol",
                params: { modo: "edicao" },
              })
            }
          />
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
        mostrarVinculo={dados?.futebol?.tipoCadastro === "mensalistas_e_avulsos"}
        vinculo={vinculo}
        erroNome={erroNome}
        onNomeChange={(valor) => {
          setNome(valor);
          setErroNome(null);
        }}
        erroFormulario={erroFormulario}
        onTipoChange={(valor) => {
          setTipo(valor);
          setPosicao(valor === "goleiro" ? "goleiro" : null);
        }}
        onPosicaoChange={setPosicao}
        onNivelChange={setNivel}
        onVinculoChange={setVinculo}
        onSalvar={() => void salvarJogador()}
        onCancelar={fecharFormulario}
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
  erroCarregamento: {
    gap: spacing.md,
  },
});
