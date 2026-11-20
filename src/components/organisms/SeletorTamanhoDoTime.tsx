import { Keyboard, StyleSheet, View } from "react-native";
import {
  CampoComRotulo,
  LinhaDeAlternador,
  ValorEmDestaque,
} from "@/components/molecules";
import { Botao } from "@/components/atoms";
import { borders, colors, radii, spacing } from "@/theme";

type SeletorTamanhoDoTimeProps = {
  modoAutomatico: boolean;
  tamanhoEmUso: number;
  textoCampo: string;
  erro: string | null;
  totalJogadores: number;
  onModoAutomaticoChange: (valor: boolean) => void;
  onTextoCampoChange: (valor: string) => void;
  textoTimes: string;
  timesEmUso: number;
  onTextoTimesChange: (valor: string) => void;
  erroTimes: string | null;
  onLimparTamanho: () => void;
  onLimparTimes: () => void;
};

export function SeletorTamanhoDoTime({
  modoAutomatico,
  tamanhoEmUso,
  textoCampo,
  erro,
  totalJogadores,
  onModoAutomaticoChange,
  onTextoCampoChange,
  textoTimes,
  timesEmUso,
  onTextoTimesChange,
  erroTimes,
  onLimparTamanho,
  onLimparTimes,
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
        <View style={styles.valores}>
          <ValorEmDestaque rotulo="Jogadores por time" valor={tamanhoEmUso} />
          <ValorEmDestaque rotulo="Times" valor={timesEmUso} />
        </View>
      ) : (
        <View style={styles.valores}>
          <View style={styles.campoLinha}>
            <View style={styles.campo}>
              <CampoComRotulo rotulo="Jogadores por time" accessibilityLabel="Jogadores por time" accessibilityHint={`Informe um número entre 2 e ${totalJogadores}.`} valor={textoCampo} placeholder={`Calculado: ${tamanhoEmUso}`} mensagemErro={erro} keyboardType="number-pad" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} onChangeText={onTextoCampoChange} />
            </View>
            <Botao variante="secundario" accessibilityLabel="Limpar jogadores por time" onPress={onLimparTamanho}>Limpar</Botao>
          </View>
          <View style={styles.campoLinha}>
            <View style={styles.campo}>
              <CampoComRotulo rotulo="Quantidade de times" accessibilityLabel="Quantidade de times" accessibilityHint={`Informe um número entre 2 e ${totalJogadores}.`} valor={textoTimes} placeholder={`Calculado: ${timesEmUso}`} mensagemErro={erroTimes} keyboardType="number-pad" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} onChangeText={onTextoTimesChange} />
            </View>
            <Botao variante="secundario" accessibilityLabel="Limpar quantidade de times" onPress={onLimparTimes}>Limpar</Botao>
          </View>
        </View>
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
  valores: { gap: spacing.md },
  campoLinha: { alignItems: "flex-end", flexDirection: "row", gap: spacing.sm },
  campo: { flex: 1 },
});
