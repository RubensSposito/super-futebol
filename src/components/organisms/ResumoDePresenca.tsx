import { StyleSheet, View } from "react-native";
import { Texto } from "@/components/atoms";
import { borders, colors, dimensions, radii, spacing } from "@/theme";

type ResumoDePresencaProps = {
  confirmados: number;
  cadastrados: number;
  goleirosConfirmados: number;
  goleirosCadastrados: number;
  jogadoresConfirmados: number;
  jogadoresCadastrados: number;
};

export function ResumoDePresenca({
  confirmados,
  cadastrados,
  goleirosConfirmados,
  goleirosCadastrados,
  jogadoresConfirmados,
  jogadoresCadastrados,
}: ResumoDePresencaProps) {
  const progresso =
    cadastrados === 0
      ? 0
      : Math.max(0, Math.min(100, (confirmados / cadastrados) * 100));

  return (
    <View style={styles.cartao}>
      <Texto variante="secao">Confirmados: {confirmados} de {cadastrados}</Texto>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`Presenças confirmadas: ${confirmados} de ${cadastrados}`}
        accessibilityValue={{
          min: 0,
          max: cadastrados,
          now: confirmados,
        }}
        style={styles.trilho}
      >
        <View style={[styles.progresso, { width: `${progresso}%` }]} />
      </View>
      <View style={styles.divisao}>
        <Texto variante="corpo">
          Goleiros: {goleirosConfirmados} de {goleirosCadastrados}
        </Texto>
        <Texto variante="corpo">
          Jogadores: {jogadoresConfirmados} de {jogadoresCadastrados}
        </Texto>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    gap: spacing.md,
    padding: spacing.lg,
  },
  trilho: {
    backgroundColor: colors.neutralBackground,
    borderRadius: radii.pill,
    height: dimensions.touchTarget / 6,
    overflow: "hidden",
    width: "100%",
  },
  progresso: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: "100%",
  },
  divisao: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
});
