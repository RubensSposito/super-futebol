import { StyleSheet, View } from "react-native";
import { Texto } from "@/components/atoms";
import {
  SeletorDeOpcoes,
  type OpcaoSeletor,
} from "@/components/molecules";
import { spacing } from "@/theme";

type BlocoDePerguntaProps<T extends string> = {
  passo: string;
  pergunta: string;
  opcoes: readonly OpcaoSeletor<T>[];
  valor: T | null;
  onChange: (valor: T) => void;
};

export function BlocoDePergunta<T extends string>({
  passo,
  pergunta,
  opcoes,
  valor,
  onChange,
}: BlocoDePerguntaProps<T>) {
  return (
    <View style={styles.container}>
      <Texto variante="legenda" cor="primary">
        {passo}
      </Texto>
      <Texto variante="pergunta">{pergunta}</Texto>
      <SeletorDeOpcoes
        rotulo={pergunta}
        opcoes={opcoes}
        valor={valor}
        onChange={(novoValor) => {
          if (novoValor !== null) {
            onChange(novoValor);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});
