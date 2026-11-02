import { StyleSheet, View } from "react-native";
import type { Jogador } from "@/types";
import { ItemDeJogador } from "@/components/molecules";
import { Texto } from "@/components/atoms";
import { borders, colors, radii, spacing } from "@/theme";

type SecaoReservasProps = {
  reservas: readonly Jogador[];
  mostrarNotaGoleiroExtra: boolean;
};

export function SecaoReservas({
  reservas,
  mostrarNotaGoleiroExtra,
}: SecaoReservasProps) {
  return (
    <View style={styles.container}>
      <Texto variante="secao">Reservas</Texto>
      {mostrarNotaGoleiroExtra ? (
        <Texto variante="legenda">
          Os reservas cobrem o gol dos times sem goleiro.
        </Texto>
      ) : null}
      {reservas.length === 0 ? (
        <Texto variante="corpo">Ninguém ficou de fora.</Texto>
      ) : (
        <View style={styles.lista}>
          {reservas.map((jogador) => (
            <ItemDeJogador key={jogador.id} jogador={jogador} />
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
});
