import { StyleSheet, View } from "react-native";
import { Texto } from "@/components/atoms";
import { borders, colors, spacing } from "@/theme";

type LinhaDeTotalProps = {
  rotulo: string;
  valor: string;
  corValor?: "textPrimary" | "error";
  destaque?: boolean;
  separadorAbaixo?: boolean;
};

export function LinhaDeTotal({
  rotulo,
  valor,
  corValor = "textPrimary",
  destaque = false,
  separadorAbaixo = false,
}: LinhaDeTotalProps) {
  return (
    <View style={[styles.linha, separadorAbaixo ? styles.separador : null]}>
      <Texto
        variante={destaque ? "secao" : "corpo"}
        style={styles.rotulo}
      >
        {rotulo}
      </Texto>
      <Texto
        variante={destaque ? "secao" : "corpo"}
        cor={corValor}
        style={styles.valor}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {valor}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  rotulo: {
    flexShrink: 1,
  },
  valor: {
    flexShrink: 1,
    textAlign: "right",
  },
  separador: {
    borderBottomColor: colors.border,
    borderBottomWidth: borders.separator,
    paddingBottom: spacing.md,
  },
});
