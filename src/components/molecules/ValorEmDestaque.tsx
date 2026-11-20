import { StyleSheet, View } from "react-native";
import { Texto } from "@/components/atoms";
import { spacing, typography } from "@/theme";

type ValorEmDestaqueProps = {
  valor: number;
  rotulo?: string;
};

export function ValorEmDestaque({ valor, rotulo = "Jogadores por time" }: ValorEmDestaqueProps) {
  return (
    <View style={styles.container}>
      <Texto variante="corpo" style={styles.valor}>
        {rotulo}: {valor}
      </Texto>
      {rotulo === "Jogadores por time" ? <Texto variante="legenda">contando o goleiro</Texto> : null}
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
