import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import type { ResultadoDivisaoTimes, TimeFormado } from "@/types";
import { SeletorTamanhoDoTime } from "./SeletorTamanhoDoTime";
import { Botao } from "@/components/atoms";
import { CartaoTime } from "./CartaoTime";
import { ResumoPartida } from "./ResumoPartida";
import { SecaoReservas } from "./SecaoReservas";
import { borders, colors, spacing } from "@/theme";

type ResultadoPartidaProps = {
  resultado: ResultadoDivisaoTimes;
  modoAutomatico: boolean;
  tamanhoEmUso: number;
  tamanhoDigitado: string;
  erroTamanho: string | null;
  onTamanhoChange: (valor: string) => void;
  onModoAutomaticoChange: (valor: boolean) => void;
  onSortearNovamente: () => void;
};

export function ResultadoPartida({
  resultado,
  modoAutomatico,
  tamanhoEmUso,
  tamanhoDigitado,
  erroTamanho,
  onTamanhoChange,
  onModoAutomaticoChange,
  onSortearNovamente,
}: ResultadoPartidaProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList<TimeFormado>
        style={styles.lista}
        contentContainerStyle={styles.conteudoLista}
        data={resultado.times}
        keyExtractor={(time) => String(time.numero)}
        renderItem={({ item }) => <CartaoTime time={item} />}
        ListHeaderComponent={
          <View style={styles.cabecalho}>
            <SeletorTamanhoDoTime
              modoAutomatico={modoAutomatico}
              tamanhoEmUso={tamanhoEmUso}
              textoCampo={tamanhoDigitado}
              erro={erroTamanho}
              totalJogadores={resultado.totais.jogadores}
              onModoAutomaticoChange={onModoAutomaticoChange}
              onTextoCampoChange={onTamanhoChange}
            />
            <ResumoPartida resultado={resultado} />
          </View>
        }
        ListFooterComponent={
          <SecaoReservas
            reservas={resultado.reservas}
            mostrarNotaGoleiroExtra={resultado.times.some(
              (time) => time.vagaExtraGoleiro,
            )}
          />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
      <View style={styles.rodape}>
        <Botao
          variante="primario"
          accessibilityLabel="Sortear novamente"
          onPress={onSortearNovamente}
        >
          🎲 Sortear novamente
        </Botao>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  rodape: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: borders.separator,
    paddingTop: spacing.md,
  },
  lista: {
    flex: 1,
  },
  conteudoLista: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  cabecalho: {
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
});
