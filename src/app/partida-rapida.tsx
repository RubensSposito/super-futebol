import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { StyleSheet, View } from "react-native";
import { Botao } from "@/components/atoms";
import {
  FormularioJogadorSheet,
  ImportarListaSheet,
  ListaDeJogadores,
  RodapeAvancar,
} from "@/components/organisms";
import { TelaBase } from "@/components/templates";
import {
  usePartidaRapidaStore,
  useQuantidadeJogadores,
} from "@/store";
import { lerListaJogadores } from "@/lib/importacao";
import { spacing } from "@/theme";
import type {
  AvisoImportacao,
  Nivel,
  Posicao,
  ResultadoColarLista,
  TipoJogador,
  Vinculo,
} from "@/types";

const ERRO_NOME_VAZIO = "Informe o nome do jogador.";
const ERRO_NOME_DUPLICADO = "Já existe um jogador com esse nome.";

export default function PartidaRapida() {
  const router = useRouter();
  const { modo } = useLocalSearchParams<{ modo?: string | string[] }>();
  const jogadores = usePartidaRapidaStore((state) => state.jogadores);
  const quantidade = useQuantidadeJogadores();
  const adicionarJogador = usePartidaRapidaStore(
    (state) => state.adicionarJogador,
  );
  const adicionarVariosJogadores = usePartidaRapidaStore(
    (state) => state.adicionarVariosJogadores,
  );
  const [formularioVisivel, setFormularioVisivel] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoJogador>("linha");
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [nivel, setNivel] = useState<Nivel | null>(null);
  const [erroNome, setErroNome] = useState<string | null>(null);
  const modoImportacao = Array.isArray(modo) ? modo[0] : modo;
  const [importacaoVisivel, setImportacaoVisivel] = useState(
    modoImportacao === "importar",
  );
  const [avisoImportacao, setAvisoImportacao] =
    useState<AvisoImportacao | null>(null);

  useEffect(() => {
    if (modoImportacao === "importar") {
      setImportacaoVisivel(true);
    }
  }, [modoImportacao]);

  function limparFormulario() {
    setNome("");
    setTipo("linha");
    setPosicao(null);
    setNivel(null);
    setErroNome(null);
  }

  function fecharFormulario() {
    setFormularioVisivel(false);
    limparFormulario();
  }

  function salvarJogador() {
    const resultado = adicionarJogador({
      nome,
      tipo,
      ...(tipo === "goleiro"
        ? { posicao: "goleiro" as const }
        : posicao
          ? { posicao }
          : {}),
      ...(nivel ? { nivel } : {}),
    });

    if (!resultado.sucesso) {
      setErroNome(
        resultado.motivo === "nome_vazio"
          ? ERRO_NOME_VAZIO
          : ERRO_NOME_DUPLICADO,
      );
      return;
    }

    setAvisoImportacao(null);
    fecharFormulario();
  }

  function importarLista(texto: string, _vinculo?: Vinculo): boolean {
    const leitura = lerListaJogadores(texto, jogadores);
    if (leitura.goleiros.length + leitura.jogadores.length === 0) {
      return false;
    }

    const adicionados = adicionarVariosJogadores(leitura);
    setAvisoImportacao({
      ...adicionados,
      repetidos: adicionados.repetidos + leitura.repetidos,
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

  return (
    <TelaBase>
      <View style={styles.acoesTopo}>
        <Botao
          variante="primario"
          accessibilityLabel="Adicionar jogador"
          onPress={() => setFormularioVisivel(true)}
          style={styles.botaoTopo}
        >
          Adicionar jogador
        </Botao>
        <Botao
          variante="secundario"
          accessibilityLabel="Importar lista"
          onPress={() => {
            setAvisoImportacao(null);
            setImportacaoVisivel(true);
          }}
          style={styles.botaoTopo}
        >
          Importar lista
        </Botao>
      </View>
      <ListaDeJogadores
        jogadores={jogadores}
        quantidade={quantidade}
        aviso={avisoImportacao}
        agrupar={false}
      />
      <RodapeAvancar
        habilitado={quantidade >= 2}
        onAvancar={() => router.push("/resultado")}
      />
      <FormularioJogadorSheet
        visivel={formularioVisivel}
        nome={nome}
        tipo={tipo}
        posicao={posicao}
        nivel={nivel}
        erroNome={erroNome}
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
        onSalvar={salvarJogador}
        onCancelar={fecharFormulario}
      />
      <ImportarListaSheet
        visivel={importacaoVisivel}
        onCancelar={() => setImportacaoVisivel(false)}
        onImportar={importarLista}
        onColar={colarLista}
      />
    </TelaBase>
  );
}

const styles = StyleSheet.create({
  acoesTopo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  botaoTopo: {
    flexBasis: "48%",
    flexGrow: 1,
  },
});
