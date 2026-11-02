import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
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
  useRascunhoCadastroStore,
} from "@/store";
import { spacing } from "@/theme";
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
  const limparRascunho = useRascunhoCadastroStore((state) => state.limpar);
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

  async function concluir() {
    if (!futebol) {
      setErroCadastro("Configure os dados do futebol antes de continuar.");
      return;
    }
    if (jogadores.length < 2) {
      setErroCadastro("Cadastre pelo menos 2 jogadores.");
      return;
    }
    setSalvando(true);
    setErroCadastro(null);
    const resultado = await concluirCadastroCompleto(
      criarFutebolDoRascunho(futebol, obterDataLocal()),
      jogadores.map(({ id: _id, ...jogador }) => jogador),
    );
    setSalvando(false);
    if (!resultado.sucesso) {
      setErroCadastro(resultado.mensagem);
      return;
    }
    router.dismissAll();
    router.replace("/home");
    limparRascunho();
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

  return (
    <TelaBase>
      <View style={styles.introducao}>
        <Texto variante="titulo">Cadastrar jogadores</Texto>
        <Texto variante="corpo">
          Adicione manualmente ou importe uma lista para concluir a configuração.
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
          diasSemana={futebol.diasSemana}
          frequencia={futebol.frequencia}
          mostrarMensalistas={controlarMensalistas}
          mostrarAvulsos={controlarAvulsos}
        />
      ) : null}
      <ListaDeJogadores
        jogadores={jogadores}
        quantidade={jogadores.length}
        quantidadeEsperada={futebol.quantidadeJogadores}
        aviso={avisoImportacao}
        mostrarVinculo={futebol.tipoCadastro === "mensalistas_e_avulsos"}
        onEditar={iniciarEdicao}
      />
      {erroCadastro ? (
        <Texto variante="legenda" cor="error">
          {erroCadastro}
        </Texto>
      ) : null}
      <Botao
        variante="primario"
        accessibilityLabel="Salvar configuração e concluir cadastro"
        desabilitado={salvando}
        onPress={() => void concluir()}
      >
        {salvando ? "Salvando..." : "Concluir cadastro"}
      </Botao>
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
  introducao: {
    gap: spacing.sm,
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
});
