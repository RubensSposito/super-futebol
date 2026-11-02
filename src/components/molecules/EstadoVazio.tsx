import { StyleSheet, Text, View } from "react-native";
import { Texto } from "@/components/atoms";
import { dimensions, spacing, typography } from "@/theme";

type EstadoVazioProps = {
  mensagem: string;
};

export function EstadoVazio({ mensagem }: EstadoVazioProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚽</Text>
      <Texto variante="corpo">{mensagem}</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emoji: {
    fontSize: typography.sizes.hero,
    height: dimensions.heroBall,
  },
});
