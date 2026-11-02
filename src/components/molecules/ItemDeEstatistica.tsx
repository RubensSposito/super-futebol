import { StyleSheet, View } from "react-native";
import { Texto } from "@/components/atoms";
import {
  borders,
  colors,
  dimensions,
  radii,
  spacing,
  teamColors,
} from "@/theme";

type ItemDeEstatisticaProps = {
  rotulo: string;
  valor: number;
  indiceCor: number;
};

export function ItemDeEstatistica({
  rotulo,
  valor,
  indiceCor,
}: ItemDeEstatisticaProps) {
  const cor = teamColors[indiceCor % teamColors.length];
  return (
    <View style={[styles.container, { backgroundColor: cor.soft }]}>
      <Texto variante="legenda" style={{ color: cor.strong }}>
        {rotulo}
      </Texto>
      <Texto variante="secao" style={{ color: cor.strong }}>
        {valor}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    minWidth: dimensions.statisticMinWidth,
    flexBasis: "30%",
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
});
