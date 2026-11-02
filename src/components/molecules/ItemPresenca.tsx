import { Pressable, StyleSheet, View } from "react-native";
import type { Jogador } from "@/types";
import { Alternador, Botao, Texto } from "@/components/atoms";
import { borders, colors, dimensions, radii, spacing } from "@/theme";

type ItemPresencaProps = {
  jogador: Jogador;
  presente: boolean;
  onChange: (presente: boolean) => void;
  onEdit?: () => void;
};

export function ItemPresenca({
  jogador,
  presente,
  onChange,
  onEdit,
}: ItemPresencaProps) {
  return (
    <View style={styles.item}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${jogador.nome}, ${presente ? "presente" : "ausente"}`}
        accessibilityState={{ selected: presente }}
        onPress={() => onChange(!presente)}
        style={styles.conteudo}
      >
        <Texto variante="corpo" numberOfLines={1} ellipsizeMode="tail">
          {jogador.nome}
        </Texto>
        <Texto variante="legenda">
          {presente ? "Presente" : "Ausente"}
        </Texto>
      </Pressable>
      <Alternador
        valor={presente}
        rotuloAcessibilidade={`Presença de ${jogador.nome}`}
        onChange={onChange}
      />
      {onEdit ? (
        <Botao
          variante="secundario"
          accessibilityLabel="Editar jogador"
          onPress={onEdit}
          style={styles.editar}
        >
          ✏️
        </Botao>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: dimensions.presenceRowMinimumHeight,
    padding: spacing.lg,
  },
  conteudo: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: dimensions.touchTarget,
  },
  editar: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: dimensions.touchTarget,
    paddingHorizontal: spacing.sm,
  },
});
