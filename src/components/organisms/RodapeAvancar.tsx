import { StyleSheet, View } from "react-native";
import { Botao, Texto } from "@/components/atoms";
import { borders, colors, spacing } from "@/theme";

type RodapeAvancarProps = {
  habilitado: boolean;
  onAvancar: () => void;
};

export function RodapeAvancar({
  habilitado,
  onAvancar,
}: RodapeAvancarProps) {
  return (
    <View style={styles.container}>
      <Botao
        variante="primario"
        accessibilityLabel="Avançar para os times do dia"
        desabilitado={!habilitado}
        onPress={onAvancar}
      >
        Avançar
      </Botao>
      {!habilitado ? (
        <Texto variante="legenda">
          Cadastre pelo menos 2 jogadores para avançar.
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: borders.separator,
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
});
