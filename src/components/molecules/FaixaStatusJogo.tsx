import { StyleSheet, View } from "react-native";
import { Texto } from "@/components/atoms";
import { colors, radii, spacing } from "@/theme";

type FaixaStatusJogoProps = {
  texto: string;
};

export function FaixaStatusJogo({ texto }: FaixaStatusJogoProps) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={texto}
      style={styles.faixa}
    >
      <Texto variante="corpo">{texto}</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    backgroundColor: colors.neutralBackground,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
