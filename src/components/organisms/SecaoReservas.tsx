import { StyleSheet, View } from "react-native";
import type { Jogador } from "@/types";
import { ItemDeJogador } from "@/components/molecules";
import { Texto } from "@/components/atoms";
import { borders, colors, radii, spacing } from "@/theme";

type SecaoReservasProps = {
  reservas: readonly Jogador[];
  mostrarNotaGoleiroExtra: boolean;
  jogadorSelecionadoId?: string | null;
  onSelecionarJogador?: (jogador: Jogador) => void;
};

export function SecaoReservas({
  reservas,
  mostrarNotaGoleiroExtra,
  jogadorSelecionadoId,
  onSelecionarJogador,
}: SecaoReservasProps) {
  return (
    <View style={styles.container}>
      <Texto variante="secao">Reservas · próximos a entrar ({reservas.length})</Texto>
      {mostrarNotaGoleiroExtra ? (
        <Texto variante="legenda">
          Os reservas cobrem o gol dos times sem goleiro.
        </Texto>
      ) : null}
      {reservas.length === 0 ? (
        <Texto variante="corpo">Ninguém ficou de fora.</Texto>
      ) : (
        <View style={styles.lista}>
          {reservas.map((jogador, indice) => (
            <View key={jogador.id} style={styles.item}>
              <Texto variante="corpo" style={styles.numero}>{indice + 1}.</Texto>
              <View style={styles.jogador}>
                <ItemDeJogador
                  jogador={jogador}
                  selecionado={jogadorSelecionadoId === jogador.id}
                  onPress={
                    onSelecionarJogador
                      ? () => onSelecionarJogador(jogador)
                      : undefined
                  }
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutralBackground,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderStyle: "dashed",
    borderWidth: borders.dash,
    gap: spacing.md,
    padding: spacing.lg,
  },
  lista: {
    gap: spacing.md,
  },
  item: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  numero: { minWidth: spacing.xl },
  jogador: { flex: 1 },
});
