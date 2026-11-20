import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { borders, colors, dimensions, radii, spacing, typography } from "@/theme";

type CheckboxProps = {
  marcado: boolean;
  desabilitado?: boolean;
  accessibilityLabel: string;
  rotulo?: string;
  onChange: (marcado: boolean) => void;
  style?: ViewStyle;
};

export function Checkbox({
  marcado,
  desabilitado = false,
  accessibilityLabel,
  rotulo,
  onChange,
  style,
}: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: marcado, disabled: desabilitado }}
      disabled={desabilitado}
      onPress={() => onChange(!marcado)}
      style={({ pressed }) => [
        styles.alvo,
        rotulo ? styles.alvoComRotulo : null,
        pressed && !desabilitado ? styles.pressionado : null,
        desabilitado ? styles.desabilitado : null,
        style,
      ]}
    >
      <View style={[styles.caixa, marcado ? styles.marcada : null]}>
        {marcado ? <Ionicons name="checkmark" color={colors.white} size={dimensions.checkboxIcon} /> : null}
      </View>
      {rotulo ? <Text maxFontSizeMultiplier={1.3} style={styles.rotulo}>{rotulo}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  alvo: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: dimensions.touchTarget,
    minWidth: dimensions.touchTarget,
    flexDirection: "row",
    gap: spacing.xs,
    borderRadius: radii.sm,
    padding: spacing.xs,
  },
  alvoComRotulo: {
    minWidth: dimensions.touchTarget,
    justifyContent: "flex-start",
  },
  caixa: {
    alignItems: "center",
    justifyContent: "center",
    width: dimensions.checkboxSize,
    height: dimensions.checkboxSize,
    borderColor: colors.primary,
    borderRadius: radii.checkbox,
    borderWidth: borders.highlight,
    backgroundColor: colors.surface,
  },
  marcada: {
    backgroundColor: colors.primary,
  },
  pressionado: {
    backgroundColor: colors.primarySoftPressed,
  },
  desabilitado: {
    opacity: 0.55,
  },
  rotulo: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
  },
});
