import { useEffect, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { StyleSheet, View } from "react-native";
import { TEMPLATE_IMPORTACAO } from "@/constants";
import { Botao, Texto } from "@/components/atoms";
import { borders, colors, radii, spacing, typography } from "@/theme";

export function CaixaDeTemplate() {
  const [copiado, setCopiado] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  async function copiarTemplate() {
    await Clipboard.setStringAsync(TEMPLATE_IMPORTACAO);
    setCopiado(true);
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <View style={styles.container}>
      <View style={styles.template}>
        <Texto variante="corpo" style={styles.templateTexto}>
          {TEMPLATE_IMPORTACAO}
        </Texto>
      </View>
      <Botao
        variante="secundario"
        accessibilityLabel={copiado ? "Copiado" : "Copiar template"}
        onPress={copiarTemplate}
      >
        {copiado ? "Copiado ✓" : "Copiar template"}
      </Botao>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  template: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  templateTexto: {
    color: colors.textPrimary,
    fontFamily: typography.families.monospace,
    fontSize: typography.sizes.button,
    lineHeight: typography.lineHeights.template,
  },
});
