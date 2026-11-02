import { StyleSheet, View } from "react-native";
import type { ResumoFinanceiro as DadosResumoFinanceiro } from "@/lib/financeiro";
import { CartaoAvulsos } from "./CartaoAvulsos";
import { CartaoMensalistas } from "./CartaoMensalistas";
import { spacing } from "@/theme";

type ResumoFinanceiroProps = {
  resumo: DadosResumoFinanceiro;
  mostrarMensalistas: boolean;
  mostrarAvulsos: boolean;
};

export function ResumoFinanceiro({
  resumo,
  mostrarMensalistas,
  mostrarAvulsos,
}: ResumoFinanceiroProps) {
  return (
    <View style={styles.resumo}>
      {mostrarMensalistas ? (
        <CartaoMensalistas
          sugeridoCentavos={resumo.mensalidadeSugeridaCentavos}
          sugeridoTotalCentavos={resumo.mensalidadeSugeridaTotalCentavos}
          escolhidoCentavos={resumo.mensalidadeEscolhidaCentavos}
          escolhidoTotalCentavos={resumo.mensalidadeEscolhidaTotalCentavos}
        />
      ) : null}
      {mostrarAvulsos ? (
        <CartaoAvulsos
          sugeridoCentavos={resumo.avulsoSugeridoCentavos}
          sugeridoTotalCentavos={resumo.avulsoSugeridoTotalCentavos}
          escolhidoCentavos={resumo.avulsoEscolhidoCentavos}
          escolhidoTotalCentavos={resumo.avulsoEscolhidoTotalCentavos}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  resumo: {
    gap: spacing.xxxl,
  },
});
