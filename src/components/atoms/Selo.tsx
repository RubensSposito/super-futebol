import { StyleSheet, Text } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

export type TipoSelo =
  | import("@/types").TipoJogador
  | import("@/types").Nivel
  | import("@/types").Vinculo
  | "sucesso"
  | "aviso"
  | "erro"
  | "neutro";

type SeloProps = {
  children: string;
  tipo: TipoSelo;
};

const EMOJIS: Partial<Record<TipoSelo, string>> = {
  goleiro: "🧤",
};

export function Selo({ children, tipo }: SeloProps) {
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      style={[styles.base, styles[tipo]]}
    >
      {EMOJIS[tipo] ? `${EMOJIS[tipo]} ` : ""}
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  goleiro: {
    backgroundColor: colors.goalkeeperBackground,
    color: colors.goalkeeperText,
  },
  linha: {
    backgroundColor: colors.playerBackground,
    color: colors.playerText,
  },
  mensalista: {
    backgroundColor: colors.monthlyBackground,
    color: colors.monthlyText,
  },
  avulso: {
    backgroundColor: colors.casualBackground,
    color: colors.casualText,
  },
  sucesso: {
    backgroundColor: colors.successBackground,
    color: colors.successText,
  },
  aviso: {
    backgroundColor: colors.warningBackground,
    color: colors.warningText,
  },
  iniciante: {
    backgroundColor: colors.perebaBackground,
    color: colors.perebaText,
  },
  amador: {
    backgroundColor: colors.amadorBackground,
    color: colors.amadorText,
  },
  semi_profissional: {
    backgroundColor: colors.semiProfissionalBackground,
    color: colors.semiProfissionalText,
  },
  profissional: {
    backgroundColor: colors.profissionalBackground,
    color: colors.profissionalText,
  },
  erro: {
    backgroundColor: colors.errorBackground,
    color: colors.error,
  },
  neutro: {
    backgroundColor: colors.neutralBackground,
    color: colors.neutralText,
  },
});
