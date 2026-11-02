import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Texto } from "@/components/atoms";
import { colors, dimensions, radii, spacing, typography } from "@/theme";

export function HeroBoasVindas() {
  return (
    <View style={styles.container}>
      <View style={styles.emojiCirculo}>
        <Text style={styles.emoji}>⚽</Text>
      </View>
      <Texto variante="titulo" style={styles.titulo}>
        Bem-vindo ao Super Futebol
      </Texto>
      <Texto variante="corpo" style={styles.subtitulo}>
        Organize presenças, times e mensalidades do seu futebol, tudo offline.
      </Texto>
      <ActivityIndicator color={colors.primary} size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.lg,
  },
  emojiCirculo: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: dimensions.heroBall,
    justifyContent: "center",
    width: dimensions.heroBall,
  },
  emoji: {
    fontSize: typography.sizes.hero,
  },
  titulo: {
    textAlign: "center",
  },
  subtitulo: {
    textAlign: "center",
  },
});
