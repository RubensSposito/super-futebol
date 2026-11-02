import { StyleSheet, Text, View } from "react-native";
import type { Jogador } from "@/types";
import { dimensions, radii, teamColors, typography } from "@/theme";

type AvatarProps = {
  jogador: Pick<Jogador, "nome">;
};

function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toLocaleUpperCase();
}

function indiceCor(nome: string): number {
  let hash = 0;
  for (const caractere of nome.toLowerCase()) {
    hash = (hash * 31 + caractere.charCodeAt(0)) >>> 0;
  }
  return hash % teamColors.length;
}

export function Avatar({ jogador }: AvatarProps) {
  const cor = teamColors[indiceCor(jogador.nome)];
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Iniciais de ${jogador.nome}: ${iniciais(jogador.nome)}`}
      style={[styles.avatar, { backgroundColor: cor.soft }]}
    >
      <Text style={[styles.iniciais, { color: cor.strong }]}>
        {iniciais(jogador.nome)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: radii.pill,
    height: dimensions.avatar,
    justifyContent: "center",
    width: dimensions.avatar,
  },
  iniciais: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
  },
});
