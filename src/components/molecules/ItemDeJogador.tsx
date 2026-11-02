import { StyleSheet, View } from "react-native";
import type { Jogador } from "@/types";
import { NIVEIS, POSICOES, POSICAO_GOLEIRO, VINCULOS } from "@/constants";
import { Alternador, Avatar, Botao, Selo, Texto } from "@/components/atoms";
import {
  borders,
  colors,
  dimensions,
  radii,
  spacing,
  typography,
} from "@/theme";

type ItemDeJogadorProps = {
  jogador: Jogador;
  ficticio?: boolean;
  onEdit?: () => void;
  presente?: boolean;
  onPresencaChange?: (presente: boolean) => void;
  mostrarTipo?: boolean;
  mostrarVinculo?: boolean;
};

export function ItemDeJogador({
  jogador,
  ficticio = false,
  onEdit,
  presente,
  onPresencaChange,
  mostrarTipo = true,
  mostrarVinculo = true,
}: ItemDeJogadorProps) {
  const posicao =
    jogador.posicao === "goleiro"
      ? POSICAO_GOLEIRO
      : POSICOES.find((opcao) => opcao.value === jogador.posicao);
  const nivel = jogador.nivel
    ? NIVEIS.find((opcao) => opcao.value === jogador.nivel)
    : undefined;
  const vinculo = jogador.vinculo
    ? VINCULOS.find((opcao) => opcao.value === jogador.vinculo)
    : undefined;

  return (
    <View style={styles.item}>
      <Avatar jogador={jogador} />
      <View style={styles.conteudo}>
        <Texto
          variante="corpo"
          cor={ficticio ? "textSecondary" : "textPrimary"}
          numberOfLines={2}
          ellipsizeMode="tail"
          style={ficticio ? [styles.nome, styles.ficticio] : styles.nome}
        >
          {jogador.nome}
        </Texto>
        <View style={styles.selos}>
          {presente !== undefined ? (
            <Selo tipo={presente ? "sucesso" : "neutro"}>
              {presente ? "Confirmado ✓" : "Pendente"}
            </Selo>
          ) : null}
          {mostrarTipo ? (
            <Selo tipo={jogador.tipo}>
              {jogador.tipo === "goleiro" ? "Goleiro" : "Linha"}
            </Selo>
          ) : null}
          {posicao ? <Selo tipo="neutro">{posicao.label}</Selo> : null}
          {nivel && jogador.nivel ? (
            <Selo tipo={jogador.nivel}>{nivel.label}</Selo>
          ) : null}
          {mostrarVinculo && vinculo ? (
            <Selo tipo={vinculo.value}>{vinculo.label}</Selo>
          ) : null}
        </View>
      </View>
      {onPresencaChange || onEdit ? (
        <View style={styles.acoes}>
          {onPresencaChange && presente !== undefined ? (
            <Alternador
              valor={presente}
              rotuloAcessibilidade={`Presença de ${jogador.nome}`}
              onChange={onPresencaChange}
            />
          ) : null}
          {onEdit ? (
            <Botao
              variante="secundario"
              accessibilityLabel={`Editar jogador ${jogador.nome}`}
              onPress={onEdit}
              style={styles.editar}
            >
              ✏️
            </Botao>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  conteudo: {
    flex: 1,
    gap: spacing.sm,
  },
  nome: {
    flexShrink: 1,
    fontWeight: typography.weights.bold,
  },
  selos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  acoes: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: spacing.xs,
    minHeight: dimensions.touchTarget,
  },
  editar: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: dimensions.touchTarget,
    paddingHorizontal: spacing.sm,
  },
  ficticio: {
    fontStyle: "italic",
  },
});
