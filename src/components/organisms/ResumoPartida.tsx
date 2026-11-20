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
  const tamanhos = resultado.times.map((time) => time.jogadoresLinha.length + (time.goleiro ? 1 : 0));
  const distintos = [...new Set(tamanhos)].sort((a, b) => b - a);
  const textoTamanhos = distintos.length === 1
    ? `de ${distintos[0]} jogadores`
    : `de ${distintos[0]} e ${distintos[1]} jogadores`;
  if (resultado.motivo === "poucos jogadores") {
    return `Poucos jogadores para ${resultado.N} times de ${resultado.T}. Dividimos em ${resultado.N} times ${textoTamanhos}.`;
  }
  if (resultado.divisaoIgual) return `${resultado.N} times ${textoTamanhos}.`;
  if (resultado.reservas.length === 0) return `${resultado.N} times de ${resultado.T} jogadores.`;
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
          valor={resultado.reservas.length}
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
