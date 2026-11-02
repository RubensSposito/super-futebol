import { FlatList, SectionList, StyleSheet, View } from "react-native";
import type { AvisoImportacao as AvisoImportacaoTipo, Jogador, TipoJogador } from "@/types";
import {
  AvisoImportacao,
  CabecalhoSecaoJogadores,
  EstadoVazio,
  ItemDeJogador,
} from "@/components/molecules";
import { Texto } from "@/components/atoms";
import { spacing } from "@/theme";

type PropsSecaoJogadores = {
  data: readonly Jogador[];
  tipo: TipoJogador;
  confirmados?: number;
};

type ListaDeJogadoresProps = {
  jogadores: readonly Jogador[];
  quantidade: number;
  aviso?: AvisoImportacaoTipo | null;
  quantidadeEsperada?: number;
  mostrarVinculo?: boolean;
  agrupar?: boolean;
  onEditar?: (jogador: Jogador) => void;
};

export function ListaDeJogadores({
  jogadores,
  quantidade,
  aviso = null,
  quantidadeEsperada,
  mostrarVinculo = true,
  agrupar = true,
  onEditar,
}: ListaDeJogadoresProps) {
  const goleiros = jogadores.filter((jogador) => jogador.tipo === "goleiro");
  const jogadoresDeLinha = jogadores.filter(
    (jogador) => jogador.tipo === "linha",
  );
  const secoes: Array<{
    tipo: TipoJogador;
    data: readonly Jogador[];
  }> = [
    { tipo: "goleiro", data: goleiros },
    { tipo: "linha", data: jogadoresDeLinha },
  ];

  const cabecalho = (
    <View style={styles.cabecalho}>
      {aviso ? <AvisoImportacao aviso={aviso} /> : null}
      <Texto variante="secao">
        {quantidadeEsperada === undefined
          ? `Jogadores (${quantidade})`
          : `Jogadores (${quantidade} de ${quantidadeEsperada})`}
      </Texto>
    </View>
  );

  if (!agrupar) {
    return (
      <FlatList
        accessibilityLabel="Lista de jogadores cadastrados"
        style={styles.lista}
        contentContainerStyle={styles.conteudo}
        data={jogadores}
        keyExtractor={(jogador) => jogador.id}
        renderItem={({ item }) => (
          <ItemDeJogador
            jogador={item}
            mostrarVinculo={mostrarVinculo}
            onEdit={onEditar ? () => onEditar(item) : undefined}
          />
        )}
        ListHeaderComponent={cabecalho}
        ItemSeparatorComponent={SeparadorJogadores}
        ListEmptyComponent={
          <EstadoVazio mensagem="Nenhum jogador cadastrado ainda." />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    );
  }

  return (
    <SectionList<Jogador, PropsSecaoJogadores>
      accessibilityLabel="Lista de jogadores cadastrados"
      style={styles.lista}
      contentContainerStyle={styles.conteudo}
      sections={secoes}
      keyExtractor={(jogador) => jogador.id}
      renderItem={({ item }) => (
        <ItemDeJogador
          jogador={item}
          mostrarTipo={false}
          mostrarVinculo={mostrarVinculo}
          onEdit={onEditar ? () => onEditar(item) : undefined}
        />
      )}
      renderSectionHeader={({ section }) => (
        <CabecalhoSecaoJogadores
          tipo={section.tipo}
          quantidade={section.data.length}
        />
      )}
      renderSectionFooter={({ section }) =>
        section.data.length === 0 ? (
          <Texto variante="legenda" style={styles.vazioSecao}>
            {section.tipo === "goleiro"
              ? "Nenhum goleiro cadastrado ainda."
              : "Nenhum jogador cadastrado ainda."}
          </Texto>
        ) : null
      }
      ListHeaderComponent={cabecalho}
      ItemSeparatorComponent={SeparadorJogadores}
      SectionSeparatorComponent={SeparadorSecoes}
      stickySectionHeadersEnabled={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
}

function SeparadorJogadores() {
  return <View style={styles.separador} />;
}

function SeparadorSecoes() {
  return <View style={styles.separadorSecoes} />;
}

const styles = StyleSheet.create({
  lista: {
    flex: 1,
  },
  conteudo: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  cabecalho: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  separador: {
    height: spacing.md,
  },
  separadorSecoes: {
    height: spacing.lg,
  },
  vazioSecao: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
