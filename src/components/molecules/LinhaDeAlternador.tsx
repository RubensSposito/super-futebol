import {
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
} from "react-native";
import { Alternador, Texto } from "@/components/atoms";
import { dimensions, spacing } from "@/theme";

type LinhaDeAlternadorProps = {
  titulo: string;
  apoio: string;
  valor: boolean;
  onChange: (valor: boolean) => void;
};

export function LinhaDeAlternador({
  titulo,
  apoio,
  valor,
  onChange,
}: LinhaDeAlternadorProps) {
  function estiloPressionado(state: PressableStateCallbackType) {
    return [styles.textos, state.pressed ? styles.pressionada : null];
  }

  return (
    <View style={styles.linha}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Alternar ${titulo}`}
        accessibilityHint={`Toque para ${valor ? "desativar" : "ativar"} esta opção. ${apoio}`}
        onPress={() => onChange(!valor)}
        style={estiloPressionado}
      >
        <Texto variante="corpo">{titulo}</Texto>
        <Texto variante="legenda">{apoio}</Texto>
      </Pressable>
      <View style={styles.alternador}>
        <Alternador
          valor={valor}
          rotuloAcessibilidade="Calcular automaticamente"
          onChange={onChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: dimensions.toggleRowMinimumHeight,
  },
  textos: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: dimensions.toggleRowMinimumHeight,
    paddingRight: spacing.sm,
  },
  alternador: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: dimensions.toggleRowMinimumHeight,
    minWidth: dimensions.touchTarget,
  },
  pressionada: {
    opacity: 0.72,
  },
});
