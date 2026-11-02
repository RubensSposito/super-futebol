import { StyleSheet, View } from "react-native";
import { Texto } from "@/components/atoms";
import { formatarMoedaPtBr } from "@/lib/financeiro";
import {
  colors,
  dimensions,
  radii,
  spacing,
  typography,
} from "@/theme";

type BlocoDeValorProps = {
  rotulo: string;
  valorCentavos: number | null;
  rotuloTotal: string;
  totalCentavos: number | null;
  tipo: "sugerido" | "escolhido";
};

export function BlocoDeValor({
  rotulo,
  valorCentavos,
  rotuloTotal,
  totalCentavos,
  tipo,
}: BlocoDeValorProps) {
  return (
    <View style={[styles.bloco, styles[tipo]]}>
      <Texto variante="legenda">{rotulo}</Texto>
      <Texto
        variante="corpo"
        style={styles.valor}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {valorCentavos === null
          ? "Não informado"
          : formatarMoedaPtBr(valorCentavos)}
      </Texto>
      <Texto variante="legenda" numberOfLines={2}>
        {rotuloTotal}:{" "}
        {totalCentavos === null
          ? "—"
          : formatarMoedaPtBr(totalCentavos)}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: {
    borderRadius: radii.card,
    flexBasis: dimensions.financeBlockMinWidth,
    flexGrow: 1,
    gap: spacing.sm,
    minWidth: 0,
    padding: spacing.lg,
  },
  sugerido: {
    backgroundColor: colors.neutralBackground,
  },
  escolhido: {
    backgroundColor: colors.primarySoft,
  },
  valor: {
    fontSize: typography.sizes.section,
    fontWeight: typography.weights.bold,
  },
});
