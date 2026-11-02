import {
  StyleSheet,
  View,
  type TextInputProps,
} from "react-native";
import { CampoTexto, Texto } from "@/components/atoms";
import { colors, spacing } from "@/theme";

type CampoComRotuloProps = {
  rotulo: string;
  accessibilityLabel: string;
  valor: string;
  placeholder?: string;
  mensagemErro?: string | null;
  keyboardType?: TextInputProps["keyboardType"];
  returnKeyType?: TextInputProps["returnKeyType"];
  accessibilityHint?: string;
  onSubmitEditing?: TextInputProps["onSubmitEditing"];
  onChangeText: (valor: string) => void;
};

export function CampoComRotulo({
  rotulo,
  accessibilityLabel,
  valor,
  placeholder,
  mensagemErro,
  keyboardType,
  returnKeyType,
  accessibilityHint,
  onSubmitEditing,
  onChangeText,
}: CampoComRotuloProps) {
  return (
    <View style={styles.container}>
      <Texto variante="legenda">{rotulo}</Texto>
      <CampoTexto
        accessibilityLabel={accessibilityLabel}
        value={valor}
        placeholder={placeholder}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        accessibilityHint={accessibilityHint}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        autoCapitalize="words"
      />
      {mensagemErro ? (
        <Texto variante="legenda" cor="error">
          {mensagemErro}
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
