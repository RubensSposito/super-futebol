import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Texto } from "@/components/atoms";
import {
  borders,
  colors,
  dimensions,
  durations,
  radii,
  spacing,
} from "@/theme";

type CartaoRecolhivelProps = {
  titulo: string;
  resumo: ReactNode;
  children: ReactNode;
  inicialmenteRecolhido?: boolean;
  onAlternar?: (expandido: boolean) => void;
};

export function CartaoRecolhivel({
  titulo,
  resumo,
  children,
  inicialmenteRecolhido = true,
  onAlternar,
}: CartaoRecolhivelProps) {
  const [expandido, setExpandido] = useState(!inicialmenteRecolhido);
  const [movimentoReduzido, setMovimentoReduzido] = useState<boolean | null>(
    null,
  );
  const rotacao = useRef(new Animated.Value(expandido ? 1 : 0)).current;

  useEffect(() => {
    let ativo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduzido) => {
      if (ativo) setMovimentoReduzido(reduzido);
    });
    const assinatura = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setMovimentoReduzido,
    );

    return () => {
      ativo = false;
      assinatura.remove();
    };
  }, []);

  useEffect(() => {
    if (movimentoReduzido) {
      rotacao.stopAnimation();
      rotacao.setValue(expandido ? 1 : 0);
    }
  }, [expandido, movimentoReduzido, rotacao]);

  function alternar() {
    const novoEstado = !expandido;
    setExpandido(novoEstado);
    onAlternar?.(novoEstado);

    const destino = novoEstado ? 1 : 0;
    if (movimentoReduzido !== false) {
      rotacao.setValue(destino);
      return;
    }

    LayoutAnimation.configureNext({
      duration: durations.cardToggle,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    Animated.timing(rotacao, {
      toValue: destino,
      duration: durations.cardToggle,
      useNativeDriver: true,
    }).start();
  }

  const giro = rotacao.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  function estiloCabecalho(state: PressableStateCallbackType) {
    return [
      styles.cabecalho,
      state.pressed ? styles.cabecalhoPressionado : null,
    ];
  }

  return (
    <View style={styles.cartao}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expandido ? "Recolher" : "Expandir"} ${titulo}`}
        accessibilityState={{ expanded: expandido }}
        onPress={alternar}
        style={estiloCabecalho}
      >
        <View style={styles.textosCabecalho}>
          <Texto variante="secao">{titulo}</Texto>
          <View style={styles.resumo}>{resumo}</View>
        </View>
        <Animated.View
          accessible={false}
          style={[styles.indicador, { transform: [{ rotate: giro }] }]}
        >
          <Ionicons
            name="chevron-down"
            color={colors.primaryText}
            size={dimensions.collapsibleIconSize}
          />
        </Animated.View>
      </Pressable>
      <View
        accessibilityElementsHidden={!expandido}
        importantForAccessibility={expandido ? "auto" : "no-hide-descendants"}
        style={[styles.conteudo, !expandido ? styles.conteudoRecolhido : null]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    overflow: "hidden",
  },
  cabecalho: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: dimensions.toggleRowMinimumHeight,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  cabecalhoPressionado: {
    backgroundColor: colors.primarySoftPressed,
  },
  textosCabecalho: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  resumo: {
    minWidth: 0,
  },
  indicador: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: dimensions.collapsibleIconDiameter,
    justifyContent: "center",
    width: dimensions.collapsibleIconDiameter,
  },
  conteudo: {
    borderTopColor: colors.border,
    borderTopWidth: borders.separator,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  conteudoRecolhido: {
    height: 0,
    overflow: "hidden",
    paddingBottom: spacing.none,
    paddingTop: spacing.none,
  },
});
