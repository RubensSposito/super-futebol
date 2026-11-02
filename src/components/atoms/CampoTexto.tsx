import { useState } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import {
  borders,
  colors,
  dimensions,
  radii,
  spacing,
  typography,
} from "@/theme";

type CampoTextoProps = Omit<TextInputProps, "accessibilityLabel"> & {
  accessibilityLabel: string;
};

export function CampoTexto({
  accessibilityLabel,
  style,
  ...props
}: CampoTextoProps) {
  const [focado, setFocado] = useState(false);
  return (
    <TextInput
      {...props}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      maxFontSizeMultiplier={1.3}
      onFocus={(event) => {
        setFocado(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocado(false);
        props.onBlur?.(event);
      }}
      style={[styles.campo, focado ? styles.focado : null, style]}
    />
  );
}

const styles = StyleSheet.create({
  campo: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.field,
    borderWidth: borders.surface,
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    minHeight: dimensions.touchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  focado: {
    borderColor: colors.primary,
  },
});
