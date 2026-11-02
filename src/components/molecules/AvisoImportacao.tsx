import { StyleSheet, View } from "react-native";
import type { AvisoImportacao } from "@/types";
import { Texto } from "@/components/atoms";
import { borders, colors, radii, spacing } from "@/theme";

type AvisoImportacaoProps = {
  aviso: AvisoImportacao;
};

function criarResumo(aviso: AvisoImportacao): string {
  const importados = `Importados: ${aviso.goleirosAdicionados} ${
    aviso.goleirosAdicionados === 1 ? "goleiro" : "goleiros"
  } e ${aviso.jogadoresAdicionados} ${
    aviso.jogadoresAdicionados === 1 ? "jogador" : "jogadores"
  }.`;
  const ignorados: string[] = [];

  if (aviso.repetidos > 0) {
    ignorados.push(
      `${aviso.repetidos} ${
        aviso.repetidos === 1 ? "repetido" : "repetidos"
      }`,
    );
  }
  if (aviso.linhasIgnoradas > 0) {
    ignorados.push(
      `${aviso.linhasIgnoradas} ${
        aviso.linhasIgnoradas === 1 ? "linha ignorada" : "linhas ignoradas"
      }`,
    );
  }

  return ignorados.length > 0
    ? `${importados} Ignorados: ${ignorados.join(" e ")}.`
    : importados;
}

export function AvisoImportacao({ aviso }: AvisoImportacaoProps) {
  return (
    <View accessibilityRole="summary" style={styles.container}>
      <Texto variante="legenda" cor="primaryText">
        {criarResumo(aviso)}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    borderColor: colors.primarySoft,
    borderWidth: borders.surface,
    padding: spacing.md,
  },
});
