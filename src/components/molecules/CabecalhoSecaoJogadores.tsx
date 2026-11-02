import { StyleSheet, View } from "react-native";
import type { TipoJogador } from "@/types";
import { Texto } from "@/components/atoms";
import { colors, radii, spacing, typography } from "@/theme";

type CabecalhoSecaoJogadoresProps = {
  tipo: TipoJogador;
  quantidade: number;
  quantidadeTotal?: number;
  confirmados?: number;
};

export function CabecalhoSecaoJogadores({
  tipo,
  quantidade,
  quantidadeTotal = quantidade,
  confirmados,
}: CabecalhoSecaoJogadoresProps) {
  const goleiros = tipo === "goleiro";

  return (
    <View
      style={[
        styles.pilula,
        goleiros ? styles.goleiros : styles.jogadores,
      ]}
    >
      <Texto variante="corpo" style={styles.titulo}>
        {goleiros ? "🧤 Goleiros" : "⚽ Jogadores"} cadastrados ({quantidadeTotal})
      </Texto>
      {confirmados !== undefined ? (
        <Texto variante="legenda">
          {confirmados} de {quantidadeTotal} confirmados
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pilula: {
    alignSelf: "stretch",
    borderRadius: radii.pill,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  goleiros: {
    backgroundColor: colors.goalkeeperBackground,
  },
  jogadores: {
    backgroundColor: colors.playerBackground,
  },
  titulo: {
    fontWeight: typography.weights.bold,
  },
});
