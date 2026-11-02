import { StyleSheet, Text, type TextProps } from "react-native";
import { colors, typography } from "@/theme";

export type VarianteTexto =
  | "titulo"
  | "pergunta"
  | "secao"
  | "legenda"
  | "corpo";

type TextoProps = TextProps & {
  children: React.ReactNode;
  variante: VarianteTexto;
  cor?: keyof typeof colors;
};

export function Texto({ children, variante, cor, style, ...props }: TextoProps) {
  return (
    <Text
      {...props}
      maxFontSizeMultiplier={1.3}
      style={[
        styles.base,
        styles[variante],
        cor ? { color: colors[cor] } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.textPrimary,
  },
  titulo: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
  },
  pergunta: {
    fontSize: typography.sizes.question,
    fontWeight: typography.weights.bold,
  },
  secao: {
    fontSize: typography.sizes.section,
    fontWeight: typography.weights.bold,
  },
  legenda: {
    color: colors.textSecondary,
    fontSize: typography.sizes.caption,
  },
  corpo: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
});
