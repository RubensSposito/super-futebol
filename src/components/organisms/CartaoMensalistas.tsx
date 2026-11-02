import { StyleSheet, View } from "react-native";
import { Texto } from "@/components/atoms";
import { BlocoDeValor, CartaoRecolhivel } from "@/components/molecules";
import { formatarMoedaPtBr } from "@/lib/financeiro";
import { spacing } from "@/theme";

type CartaoMensalistasProps = {
  sugeridoCentavos: number;
  sugeridoTotalCentavos: number;
  escolhidoCentavos: number | null;
  escolhidoTotalCentavos: number | null;
};

export function CartaoMensalistas({
  sugeridoCentavos,
  sugeridoTotalCentavos,
  escolhidoCentavos,
  escolhidoTotalCentavos,
}: CartaoMensalistasProps) {
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
      titulo="Mensalistas (por mês)"
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
          rotuloTotal="Total"
          totalCentavos={sugeridoTotalCentavos}
          tipo="sugerido"
        />
        <BlocoDeValor
          rotulo="Escolhido"
          valorCentavos={escolhidoCentavos}
          rotuloTotal="Total"
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
