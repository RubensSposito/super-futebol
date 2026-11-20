import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

type TelaBaseProps = {
  children: ReactNode;
  rolavel?: boolean;
  centralizada?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  evitarTeclado?: boolean;
};

export function TelaBase({
  children,
  rolavel = false,
  centralizada = false,
  contentStyle,
  evitarTeclado = true,
}: TelaBaseProps) {
  const conteudo = [
    styles.conteudo,
    centralizada ? styles.centralizado : null,
    contentStyle,
  ];

  const elementoConteudo = rolavel ? (
    <ScrollView
      style={styles.rolagem}
      contentContainerStyle={[conteudo, { paddingBottom: spacing.xxxl * 2 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.conteudoFixo, ...conteudo]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.areaSegura} edges={["top", "bottom"]}>
      {evitarTeclado ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardContainer}
        >
          {elementoConteudo}
        </KeyboardAvoidingView>
      ) : (
        elementoConteudo
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  rolagem: {
    flex: 1,
  },
  conteudo: {
    flexGrow: 1,
    gap: spacing.xl,
    padding: spacing.screen,
  },
  conteudoFixo: {
    flex: 1,
  },
  centralizado: {
    justifyContent: "center",
  },
});
