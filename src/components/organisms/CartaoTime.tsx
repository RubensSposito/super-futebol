import { StyleSheet, View } from "react-native";
import type { Jogador, TimeFormado } from "@/types";
import { ItemDeJogador } from "@/components/molecules";
import { Selo, Texto } from "@/components/atoms";
import {
  borders,
  colors,
  radii,
  spacing,
  teamColors,
  typography,
} from "@/theme";

type CartaoTimeProps = {
  time: TimeFormado;
  jogadorSelecionadoId?: string | null;
  onSelecionarJogador?: (jogador: Jogador) => void;
};

export function CartaoTime({
  time,
  jogadorSelecionadoId,
  onSelecionarJogador,
}: CartaoTimeProps) {
  const cor = teamColors[(time.numero - 1) % teamColors.length];
  return (
    <View style={styles.container}>
      <View style={[styles.cabecalho, { backgroundColor: cor.strong }]}>
        <Texto variante="secao" cor="surface">
          Time {time.numero}
        </Texto>
        <Texto variante="legenda" cor="surface" style={styles.contagem}>
          {time.jogadoresLinha.length + (time.goleiro ? 1 : 0)} jogadores
        </Texto>
      </View>
      <View style={styles.corpo}>
        {time.goleiro ? (
          <ItemDeJogador
            jogador={time.goleiro}
            selecionado={jogadorSelecionadoId === time.goleiro.id}
            onPress={
              onSelecionarJogador
                ? () => onSelecionarJogador(time.goleiro!)
                : undefined
            }
          />
        ) : time.vagaExtraGoleiro ? (
          <View style={[styles.vagaExtra, { backgroundColor: cor.soft }]}>
            <Texto variante="corpo" cor="textSecondary" style={styles.textoExtra}>
              Jogador reserva do próximo time
            </Texto>
            <Selo tipo="goleiro">Goleiro</Selo>
          </View>
        ) : null}
        {time.jogadoresLinha.map((jogador) => (
          <ItemDeJogador
            key={jogador.id}
            jogador={jogador}
            selecionado={jogadorSelecionadoId === jogador.id}
            onPress={
              onSelecionarJogador
                ? () => onSelecionarJogador(jogador)
                : undefined
            }
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  cabecalho: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  contagem: {
    color: colors.surface,
    fontWeight: typography.weights.medium,
  },
  corpo: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  vagaExtra: {
    alignItems: "center",
    borderRadius: radii.card,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    padding: spacing.lg,
  },
  textoExtra: {
    flexShrink: 1,
    fontStyle: "italic",
  },
});
