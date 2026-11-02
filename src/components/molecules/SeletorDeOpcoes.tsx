import { StyleSheet, View } from "react-native";
import { Botao, Texto } from "@/components/atoms";
import { spacing } from "@/theme";

export type OpcaoSeletor<T extends string> = {
  value: T;
  label: string;
};

type SeletorDeOpcoesProps<T extends string> = {
  rotulo: string;
  opcoes: readonly OpcaoSeletor<T>[];
  valor: T | null;
  permiteDesmarcar?: boolean;
  onChange: (valor: T | null) => void;
};

export function SeletorDeOpcoes<T extends string>({
  rotulo,
  opcoes,
  valor,
  permiteDesmarcar = false,
  onChange,
}: SeletorDeOpcoesProps<T>) {
  return (
    <View style={styles.container}>
      <Texto variante="legenda">{rotulo}</Texto>
      <View style={styles.opcoes}>
        {opcoes.map((opcao) => (
          <Botao
            key={opcao.value}
            variante="opcao"
            ativo={valor === opcao.value}
            accessibilityLabel={`${rotulo}: ${opcao.label}`}
            onPress={() => {
              if (permiteDesmarcar && valor === opcao.value) {
                onChange(null);
                return;
              }
              onChange(opcao.value);
            }}
          >
            {opcao.label}
          </Botao>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  opcoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
});
