import { Keyboard, StyleSheet, View } from "react-native";
import {
  CampoComRotulo,
  LinhaDeAlternador,
  ValorEmDestaque,
} from "@/components/molecules";
import { borders, colors, radii, spacing } from "@/theme";

type SeletorTamanhoDoTimeProps = {
  modoAutomatico: boolean;
  tamanhoEmUso: number;
  textoCampo: string;
  erro: string | null;
  totalJogadores: number;
  onModoAutomaticoChange: (valor: boolean) => void;
  onTextoCampoChange: (valor: string) => void;
};

export function SeletorTamanhoDoTime({
  modoAutomatico,
  tamanhoEmUso,
  textoCampo,
  erro,
  totalJogadores,
  onModoAutomaticoChange,
  onTextoCampoChange,
}: SeletorTamanhoDoTimeProps) {
  const apoio = modoAutomatico
    ? `O app escolhe o melhor tamanho para ${totalJogadores} jogadores.`
    : "Você define quantos jogadores por time.";

  return (
    <View style={styles.container}>
      <LinhaDeAlternador
        titulo="Calcular automaticamente"
        apoio={apoio}
        valor={modoAutomatico}
        onChange={onModoAutomaticoChange}
      />
      {modoAutomatico ? (
        <ValorEmDestaque valor={tamanhoEmUso} />
      ) : (
        <CampoComRotulo
          rotulo="Jogadores por time (com goleiro)"
          accessibilityLabel="Jogadores por time (com goleiro)"
          accessibilityHint={`Informe um número inteiro entre 2 e ${totalJogadores}.`}
          valor={textoCampo}
          mensagemErro={erro}
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          onChangeText={onTextoCampoChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    gap: spacing.md,
    padding: spacing.lg,
  },
});
