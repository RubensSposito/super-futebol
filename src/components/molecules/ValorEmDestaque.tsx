import { StyleSheet, View } from "react-native";
import { Texto } from "@/components/atoms";
import { spacing, typography } from "@/theme";

type ValorEmDestaqueProps = {
  valor: number;
};

export function ValorEmDestaque({ valor }: ValorEmDestaqueProps) {
  return (
    <View style={styles.container}>
      <Texto variante="corpo" style={styles.valor}>
        {valor} jogadores por time
      </Texto>
      <Texto variante="legenda">contando o goleiro</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  valor: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
  },
});
