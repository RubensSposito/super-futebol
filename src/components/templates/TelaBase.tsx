import type { ReactNode } from "react";
import {
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
};

export function TelaBase({
  children,
  rolavel = false,
  centralizada = false,
  contentStyle,
}: TelaBaseProps) {
  const conteudo = [
    styles.conteudo,
    centralizada ? styles.centralizado : null,
    contentStyle,
  ];

  return (
    <SafeAreaView style={styles.areaSegura} edges={["top", "bottom"]}>
      {rolavel ? (
        <ScrollView
          style={styles.rolagem}
          contentContainerStyle={conteudo}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.conteudoFixo, ...conteudo]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    backgroundColor: colors.background,
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
