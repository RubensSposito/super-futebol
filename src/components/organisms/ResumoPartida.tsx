import { StyleSheet, View } from "react-native";
import type { ResultadoDivisaoTimes } from "@/types";
import { ItemDeEstatistica } from "@/components/molecules";
import { Texto } from "@/components/atoms";
import { spacing } from "@/theme";

type ResumoPartidaProps = {
  resultado: ResultadoDivisaoTimes;
};

function criarMensagemResumo(resultado: ResultadoDivisaoTimes): string {
  if (resultado.N === 0) {
    return "Jogadores insuficientes para formar um time com esse tamanho.";
  }
  if (resultado.totais.jogadores < 2 * resultado.T) {
    const tamanhos = resultado.times.map(
      (time) => time.jogadoresLinha.length + (time.goleiro ? 1 : 0),
    );
    if (tamanhos[0] === tamanhos[1]) {
      return `Poucos jogadores para times de ${resultado.T}. Dividimos em 2 times de ${tamanhos[0]} jogadores.`;
    }
    return `Poucos jogadores para times de ${resultado.T}. Dividimos em 2 times de ${tamanhos[0]} e ${tamanhos[1]} jogadores.`;
  }
  if (resultado.reservas.length === 0) {
    return `Divisão exata: ${resultado.N} times de ${resultado.T} jogadores.`;
  }
  return `${resultado.N} times de ${resultado.T} jogadores. Sobram ${resultado.reservas.length} reservas.`;
}

export function ResumoPartida({ resultado }: ResumoPartidaProps) {
  return (
    <View style={styles.container}>
      <Texto variante="secao">Resumo</Texto>
      <View style={styles.estatisticas}>
        <ItemDeEstatistica
          rotulo="Jogadores"
          valor={resultado.totais.jogadores}
          indiceCor={0}
        />
        <ItemDeEstatistica
          rotulo="Goleiros"
          valor={resultado.totais.goleiros}
          indiceCor={1}
        />
        <ItemDeEstatistica rotulo="Times" valor={resultado.N} indiceCor={2} />
        <ItemDeEstatistica
          rotulo="Reservas"
          valor={resultado.totais.reservas}
          indiceCor={3}
        />
      </View>
      <Texto variante="corpo">{criarMensagemResumo(resultado)}</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  estatisticas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
