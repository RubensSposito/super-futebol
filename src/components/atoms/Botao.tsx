import {
  Pressable,
  StyleSheet,
  Text,
  type PressableStateCallbackType,
  type ViewStyle,
} from "react-native";
import {
  borders,
  colors,
  dimensions,
  radii,
  spacing,
  typography,
} from "@/theme";

export type VarianteBotao = "primario" | "secundario" | "opcao";

type BotaoProps = {
  children: string;
  variante: VarianteBotao;
  onPress: () => void;
  accessibilityLabel: string;
  ativo?: boolean;
  desabilitado?: boolean;
  style?: ViewStyle;
};

export function Botao({
  children,
  variante,
  onPress,
  accessibilityLabel,
  ativo = false,
  desabilitado = false,
  style,
}: BotaoProps) {
  function estiloPressionado(state: PressableStateCallbackType) {
    return [
      styles.base,
      styles[variante],
      variante === "opcao" && ativo ? styles.opcaoAtiva : null,
      variante === "secundario" && ativo ? styles.secundarioAtivo : null,
      desabilitado ? styles.desabilitado : null,
      state.pressed && !desabilitado
        ? variante === "primario"
          ? styles.primarioPressionado
          : styles.pressionado
        : null,
      style,
    ];
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: desabilitado, selected: ativo }}
      disabled={desabilitado}
      onPress={onPress}
      style={estiloPressionado}
    >
      <Text
        maxFontSizeMultiplier={1.3}
        numberOfLines={2}
        style={[
          styles.texto,
          variante === "primario" ? styles.textoPrimario : null,
          desabilitado ? styles.textoDesabilitado : null,
        ]}
      >
        {variante === "opcao" && ativo ? `${children}  ✓` : children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.button,
    minHeight: dimensions.touchTarget,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primario: {
    backgroundColor: colors.primary,
  },
  secundario: {
    backgroundColor: colors.primarySoft,
  },
  secundarioAtivo: {
    backgroundColor: colors.primarySoftPressed,
    borderColor: colors.primary,
    borderWidth: borders.highlight,
  },
  opcao: {
    flexBasis: "45%",
    flexGrow: 1,
    flexShrink: 1,
    minWidth: dimensions.optionMinWidth,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: borders.option,
    borderRadius: radii.card,
    paddingHorizontal: spacing.sm,
  },
  opcaoAtiva: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pressionado: {
    opacity: 0.72,
  },
  primarioPressionado: {
    backgroundColor: colors.primaryPressed,
  },
  desabilitado: {
    backgroundColor: colors.disabledBackground,
    borderColor: colors.disabledBackground,
  },
  texto: {
    color: colors.primaryText,
    fontSize: typography.sizes.button,
    fontWeight: typography.weights.medium,
    flexShrink: 1,
    textAlign: "center",
  },
  textoPrimario: {
    color: colors.surface,
    fontWeight: typography.weights.bold,
  },
  textoDesabilitado: {
    color: colors.disabledText,
  },
});
