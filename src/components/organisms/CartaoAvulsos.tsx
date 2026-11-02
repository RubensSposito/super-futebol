import { StyleSheet, View } from "react-native";
import { Texto } from "@/components/atoms";
import { BlocoDeValor, CartaoRecolhivel } from "@/components/molecules";
import { formatarMoedaPtBr } from "@/lib/financeiro";
import { spacing } from "@/theme";

type CartaoAvulsosProps = {
  sugeridoCentavos: number;
  sugeridoTotalCentavos: number;
  escolhidoCentavos: number | null;
  escolhidoTotalCentavos: number | null;
};

export function CartaoAvulsos({
  sugeridoCentavos,
  sugeridoTotalCentavos,
  escolhidoCentavos,
  escolhidoTotalCentavos,
}: CartaoAvulsosProps) {
  const usarSugerido =
    escolhidoCentavos === null || escolhidoTotalCentavos === null;
  const valorEscolhido = usarSugerido
    ? sugeridoCentavos
    : escolhidoCentavos;
  const totalEscolhido = usarSugerido
    ? sugeridoTotalCentavos
    : escolhidoTotalCentavos;

  return (
    <CartaoRecolhivel
      titulo="Avulsos (por jogo)"
      resumo={
        <Texto variante="corpo">
          Escolhido {formatarMoedaPtBr(valorEscolhido)} · Total{" "}
          {formatarMoedaPtBr(totalEscolhido)}
        </Texto>
      }
    >
      <View style={styles.valores}>
        <BlocoDeValor
          rotulo="Sugerido"
          valorCentavos={sugeridoCentavos}
          rotuloTotal="Total por jogo"
          totalCentavos={sugeridoTotalCentavos}
          tipo="sugerido"
        />
        <BlocoDeValor
          rotulo="Escolhido"
          valorCentavos={escolhidoCentavos}
          rotuloTotal="Total por jogo"
          totalCentavos={escolhidoTotalCentavos}
          tipo="escolhido"
        />
      </View>
    </CartaoRecolhivel>
  );
}

const styles = StyleSheet.create({
  valores: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
});
