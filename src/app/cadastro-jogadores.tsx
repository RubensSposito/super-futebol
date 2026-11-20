import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Botao, Texto } from "@/components/atoms";
import {
  CartaoSaldoDoMes,
  FormularioJogadorSheet,
  ImportarListaSheet,
  ListaDeJogadores,
} from "@/components/organisms";
import { TelaBase } from "@/components/templates";
import { concluirCadastroCompleto } from "@/db";
import { obterDataLocal } from "@/lib/datas";
import { lerListaJogadores } from "@/lib/importacao";
import {
  criarFutebolDoRascunho,
  useDadosPersistidosStore,
  useRascunhoCadastroStore,
  usePartidaRapidaStore,
  useSorteioStore,
} from "@/store";
import { colors, radii, spacing } from "@/theme";
import type {
  AvisoImportacao,
  Jogador,
  Nivel,
  NovoJogador,
  Posicao,
  ResultadoColarLista,
  TipoJogador,
  Vinculo,
} from "@/types";

const ERRO_NOME_VAZIO = "Informe o nome do jogador.";
const ERRO_NOME_DUPLICADO = "Já existe um jogador com esse nome.";

function vinculoParaCadastro(
  tipoCadastro: "mensalistas_e_avulsos" | "so_mensalistas" | "basico",
  selecionado: Vinculo,
): Vinculo | undefined {
  if (tipoCadastro === "basico") return undefined;
  return tipoCadastro === "so_mensalistas" ? "mensalista" : selecionado;
}

function montarJogador(
  nome: string,
  tipo: TipoJogador,
  posicao: Posicao | null,
  nivel: Nivel | null,
  vinculo?: Vinculo,
): NovoJogador {
  return {
    nome,
    tipo,
    ...(tipo === "goleiro"
      ? { posicao: "goleiro" }
      : posicao
        ? { posicao }
        : {}),
    ...(nivel ? { nivel } : {}),
    ...(vinculo ? { vinculo } : {}),
  };
}

export default function CadastroJogadores() {
  const router = useRouter();
  const futebol = useRascunhoCadastroStore((state) => state.futebol);
  const jogadores = useRascunhoCadastroStore((state) => state.jogadores);
  const adicionarJogador = useRascunhoCadastroStore(
    (state) => state.adicionarJogador,
  );
  const adicionarVarios = useRascunhoCadastroStore(
    (state) => state.adicionarVarios,
  );
  const editarJogador = useRascunhoCadastroStore(
    (state) => state.editarJogador,
  );
  const excluirJogador = useRascunhoCadastroStore(
    (state) => state.excluirJogador,
  );
  const limparRascunho = useRascunhoCadastroStore((state) => state.limpar);
  const carregarDadosHome = useDadosPersistidosStore((state) => state.carregar);

  const [formularioVisivel, setFormularioVisivel] = useState(false);
  const [importacaoVisivel, setImportacaoVisivel] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoJogador>("linha");
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [nivel, setNivel] = useState<Nivel | null>(null);
  const [vinculo, setVinculo] = useState<Vinculo>("mensalista");
  const [jogadorEmEdicao, setJogadorEmEdicao] = useState<string | null>(null);
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [erroCadastro, setErroCadastro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [avisoImportacao, setAvisoImportacao] =
    useState<AvisoImportacao | null>(null);


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

  function confirmarExclusaoJogador() {
    if (!jogadorEmEdicao) return;
    const jogador = jogadores.find((j) => j.id === jogadorEmEdicao);
    const nomeJogador = jogador?.nome ?? nome;
    Alert.alert(
      "Excluir jogador?",
      `Deseja remover “${nomeJogador}” da lista?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir jogador",
          style: "destructive",
          onPress: () => {
            excluirJogador(jogadorEmEdicao);
            fecharFormulario();
            setMensagemSucesso(`Jogador “${nomeJogador}” excluído.`);
          },
        },
      ],
    );
  }

  function salvarJogador() {
    if (!futebol) return;
    const vinculoAplicavel = vinculoParaCadastro(futebol.tipoCadastro, vinculo);
    const novoJogador = montarJogador(
      nome,
      tipo,
      posicao,
      nivel,
      vinculoAplicavel,
    );
    const resultado = jogadorEmEdicao
      ? editarJogador(jogadorEmEdicao, novoJogador)
      : adicionarJogador(novoJogador);

    if (!resultado.sucesso) {
      if (resultado.motivo === "nome_vazio") {
        setErroNome(ERRO_NOME_VAZIO);
      } else if (resultado.motivo === "nome_duplicado") {
        setErroNome(ERRO_NOME_DUPLICADO);
      } else {
        setErroFormulario("Confira o tipo e a posição do jogador.");
      }
      return;
    }
    setErroCadastro(null);
    setAvisoImportacao(null);
    setMensagemSucesso(`Jogador ${nome} adicionado com sucesso!`);
    fecharFormulario();
  }

  function importarLista(texto: string, vinculoSelecionado?: Vinculo): boolean {
    if (!futebol) return false;
    const vinculoAplicavel = vinculoParaCadastro(
      futebol.tipoCadastro,
      vinculoSelecionado ?? "mensalista",
    );
    const leitura = lerListaJogadores(texto, jogadores, vinculoAplicavel);
    if (leitura.ordem.length === 0) return false;
    const resultado = adicionarVarios(leitura);
    setAvisoImportacao({
      ...resultado,
      repetidos: resultado.repetidos + leitura.repetidos,
      linhasIgnoradas: leitura.linhasIgnoradas,
    });
    setErroCadastro(null);
    const totalAdicionados = resultado.goleirosAdicionados + resultado.jogadoresAdicionados;
    setMensagemSucesso(`✅ ${totalAdicionados} jogadores importados com sucesso!`);
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

  async function salvarEIrParaHome() {
    if (!futebol) {
      router.replace("/home");
      return;
    }
    setSalvando(true);
    setErroCadastro(null);
    const resultado = await concluirCadastroCompleto(
      criarFutebolDoRascunho(futebol, obterDataLocal()),
      jogadores.map(({ id: _id, ...jogador }) => jogador),
    );
    if (!resultado.sucesso) {
      setSalvando(false);
      setErroCadastro(resultado.mensagem);
      return;
    }
    await carregarDadosHome(obterDataLocal(), resultado.dados);
    usePartidaRapidaStore.getState().limpar();
    useSorteioStore.getState().limpar();
    setSalvando(false);
    router.dismissAll();
    router.replace("/home");
    limparRascunho();
  }

  async function irParaSeuFutebol() {
    if (!futebol) {
      router.replace("/home");
      return;
    }
    if (jogadores.length < 2) {
      Alert.alert(
        "Acessar Seu Futebol",
        "Você ainda tem menos de 2 jogadores cadastrados. Deseja ir para a tela principal agora? Você poderá cadastrar ou importar jogadores a qualquer momento por lá.",
        [
          { text: "Continuar cadastrando", style: "cancel" },
          {
            text: "Ir para Seu Futebol",
            onPress: () => void salvarEIrParaHome(),
          },
        ],
      );
      return;
    }
    await salvarEIrParaHome();
  }

  async function concluir() {
    if (!futebol) {
      setErroCadastro("Configure os dados do futebol antes de continuar.");
      return;
    }
    if (jogadores.length < 2) {
      await irParaSeuFutebol();
      return;
    }
    await salvarEIrParaHome();
  }

  if (!futebol) {
    return (
      <TelaBase centralizada>
        <Texto variante="corpo">
          Não há uma configuração de futebol em andamento.
        </Texto>
        <Botao
          variante="secundario"
          accessibilityLabel="Voltar para configurar o futebol"
          onPress={() => router.replace("/cadastro-futebol")}
        >
          Configurar futebol
        </Botao>
      </TelaBase>
    );
  }

  const mensalistasCadastrados =
    futebol.tipoCadastro === "so_mensalistas"
      ? jogadores.length
      : jogadores.filter((jogador) => jogador.vinculo === "mensalista").length;
  const controlarMensalistas =
    futebol.controlePagamento === "mensalistas" ||
    futebol.controlePagamento === "ambos";
  const controlarAvulsos =
    futebol.controlePagamento === "avulsos" ||
    futebol.controlePagamento === "ambos";

  const cabecalhoSuperior = (
    <View style={styles.cabecalhoSuperior}>
      <View style={styles.introducao}>
        <Texto variante="titulo">Cadastrar jogadores</Texto>
        <Texto variante="corpo">
          Adicione manualmente ou importe sua lista do WhatsApp para concluir.
        </Texto>
      </View>

      <View style={styles.acoes}>
        <Botao
          variante="primario"
          accessibilityLabel="Adicionar jogador manualmente"
          onPress={() => {
            limparFormulario();
            setFormularioVisivel(true);
          }}
          style={styles.botao}
        >
          Adicionar jogador
        </Botao>
        <Botao
          variante="secundario"
          accessibilityLabel="Importar lista de jogadores"
          onPress={() => setImportacaoVisivel(true)}
          style={styles.botao}
        >
          Importar lista
        </Botao>
      </View>

      {mensagemSucesso ? (
        <View style={styles.avisoSucesso}>
          <Texto variante="corpo" cor="primary" style={styles.textoSucesso}>
            {mensagemSucesso}
          </Texto>
        </View>
      ) : null}

      {futebol.tipoCadastro !== "basico" &&
      futebol.controlePagamento !== "nenhum" &&
      futebol.valorQuadraCentavos !== null ? (
        <CartaoSaldoDoMes
          modo="atual"
          compacto
          mensalistasCadastrados={mensalistasCadastrados}
          mensalistasMeta={futebol.quantidadeMensalistas ?? 0}
          avulsosInformados={futebol.quantidadeAvulsos ?? 0}
          mensalidadeCentavos={
            controlarMensalistas ? futebol.mensalidadeCentavos : null
          }
          valorAvulsoCentavos={
            controlarAvulsos
              ? futebol.avulsoEscolhidoCentavos ??
                futebol.avulsoSugeridoCentavos
              : null
          }
          valorQuadraCentavos={futebol.valorQuadraCentavos}
          diasSemana={futebol.agenda.diasSemana}
          frequencia={futebol.agenda.frequencia}
          mostrarMensalistas={controlarMensalistas}
          mostrarAvulsos={controlarAvulsos}
        />
      ) : null}
    </View>
  );

  return (
    <TelaBase contentStyle={styles.container}>
      <Stack.Screen
        options={{
          title: "Jogadores",
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ir para tela Seu Futebol"
              onPress={() => void irParaSeuFutebol()}
              hitSlop={8}
              style={({ pressed }) => [
                styles.botaoHeader,
                pressed ? styles.botaoHeaderPressionado : null,
              ]}
            >
              <Texto variante="corpo" cor="primary" style={styles.textoBotaoHeader}>
                Seu futebol →
              </Texto>
            </Pressable>
          ),
        }}
      />

      <ListaDeJogadores
        cabecalhoSuperior={cabecalhoSuperior}
        jogadores={jogadores}
        quantidade={
          futebol.tipoCadastro === "basico"
            ? jogadores.length
            : mensalistasCadastrados
        }
        quantidadeEsperada={
          futebol.tipoCadastro === "basico"
            ? futebol.quantidadeJogadores
            : (futebol.quantidadeMensalistas ?? 0)
        }
        contadorRotulo={
          futebol.tipoCadastro === "basico" ? "Jogadores" : "Mensalistas"
        }
        aviso={avisoImportacao}
        mostrarVinculo={futebol.tipoCadastro === "mensalistas_e_avulsos"}
        onEditar={iniciarEdicao}
      />

      {erroCadastro ? (
        <Texto variante="legenda" cor="error">
          {erroCadastro}
        </Texto>
      ) : null}

      <View style={styles.rodapeFixo}>
        <Botao
          variante="primario"
          accessibilityLabel="Salvar configuração e ir para Seu Futebol"
          desabilitado={salvando}
          onPress={() => void concluir()}
        >
          {salvando
            ? "Salvando e abrindo Seu Futebol..."
            : `Concluir e ir para Seu Futebol (${jogadores.length})`}
        </Botao>
        <Botao
          variante="secundario"
          accessibilityLabel="Ir diretamente para Seu Futebol"
          onPress={() => void irParaSeuFutebol()}
        >
          Ir para Seu Futebol →
        </Botao>
      </View>

      <FormularioJogadorSheet
        visivel={formularioVisivel}
        modo={jogadorEmEdicao ? "edicao" : "criacao"}
        nome={nome}
        tipo={tipo}
        posicao={posicao}
        nivel={nivel}
        mostrarVinculo={futebol.tipoCadastro === "mensalistas_e_avulsos"}
        vinculo={vinculo}
        erroNome={erroNome}
        erroFormulario={erroFormulario}
        onNomeChange={(valor) => {
          setNome(valor);
          setErroNome(null);
        }}
        onTipoChange={(valor) => {
          setTipo(valor);
          setPosicao(valor === "goleiro" ? "goleiro" : null);
        }}
        onPosicaoChange={setPosicao}
        onNivelChange={setNivel}
        onVinculoChange={setVinculo}
        onSalvar={salvarJogador}
        onCancelar={fecharFormulario}
        onExcluir={jogadorEmEdicao ? confirmarExclusaoJogador : undefined}
      />
      <ImportarListaSheet
        visivel={importacaoVisivel}
        tipoCadastro={futebol.tipoCadastro}
        onCancelar={() => setImportacaoVisivel(false)}
        onImportar={importarLista}
        onColar={colarLista}
      />
    </TelaBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: spacing.sm,
  },
  cabecalhoSuperior: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  introducao: {
    gap: spacing.xs,
  },
  acoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  botao: {
    flexBasis: "48%",
    flexGrow: 1,
  },
  avisoSucesso: {
    backgroundColor: colors.successBackground,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  textoSucesso: {
    fontWeight: "bold",
    textAlign: "center",
  },
  rodapeFixo: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  botaoHeader: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  botaoHeaderPressionado: {
    opacity: 0.6,
  },
  textoBotaoHeader: {
    fontWeight: "bold",
  },
});
