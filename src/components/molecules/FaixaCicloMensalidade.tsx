import { StyleSheet, View } from "react-native";
import { Texto } from "@/components/atoms";
import { formatarDataCurta } from "@/lib/datas";
import { borders, colors, radii, spacing, typography } from "@/theme";

type Props = {
  inicio: string;
  fim: string;
  vencimento: string;
  diasAteVencimento: number;
};

export function FaixaCicloMensalidade({ inicio, fim, vencimento, diasAteVencimento }: Props) {
  const textoVencimento =
    diasAteVencimento === 0
      ? "Quadra vence hoje · novo ciclo iniciado"
      : `Quadra vence ${diasAteVencimento === 1 ? "em 1 dia" : `em ${diasAteVencimento} dias`} (${formatarDataCurta(vencimento)})`;
  return (
    <View style={styles.faixa}>
      <Texto variante="corpo" style={styles.titulo}>
        Ciclo {formatarDataCurta(inicio)} a {formatarDataCurta(fim)}
      </Texto>
      <Texto variante="legenda">Pagamentos referentes ao ciclo atual de hoje.</Texto>
      <Texto variante="corpo">{textoVencimento}</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  titulo: { fontWeight: typography.weights.bold },
});
