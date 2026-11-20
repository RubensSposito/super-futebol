import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Jogador } from "@/types";
import { NIVEIS, POSICOES, POSICAO_GOLEIRO, VINCULOS } from "@/constants";
import { Avatar, Selo, Texto } from "@/components/atoms";
import { CheckboxComRotulo } from "./CheckboxComRotulo";
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
  pago?: boolean;
  onPagamentoChange?: (pago: boolean) => void;
  mostrarTipo?: boolean;
  mostrarVinculo?: boolean;
  desabilitarPagamento?: boolean;
  selecionado?: boolean;
  onPress?: () => void;
};

export function ItemDeJogador({
  jogador,
  ficticio = false,
  onEdit,
  presente,
  onPresencaChange,
  pago,
  onPagamentoChange,
  mostrarTipo = false,
  mostrarVinculo = true,
  desabilitarPagamento = false,
  selecionado = false,
  onPress,
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

  // Monta subtítulo limpo e elegante (ex: "Goleiro · Amador" ou "Zagueiro · Semi-profissional")
  const partesSubtitulo: string[] = [];
  if (jogador.tipo === "goleiro") {
    partesSubtitulo.push("Goleiro");
  } else if (posicao) {
    partesSubtitulo.push(posicao.label);
  } else if (mostrarTipo) {
    partesSubtitulo.push("Linha");
  }

  if (nivel) {
    partesSubtitulo.push(nivel.label);
  }

  const subtitulo = partesSubtitulo.join(" · ");

  const conteudoCard = (
    <View style={[styles.item, selecionado ? styles.itemSelecionado : null]}>
      <View style={styles.cabecalho}>
        <Avatar jogador={jogador} />
        <View style={styles.conteudo}>
          <Texto
            variante="corpo"
            cor={ficticio ? "textSecondary" : "textPrimary"}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={ficticio ? [styles.nome, styles.ficticio] : styles.nome}
          >
            {jogador.nome}
          </Texto>
          {subtitulo ? (
            <Texto variante="legenda" cor="textSecondary" numberOfLines={1}>
              {subtitulo}
            </Texto>
          ) : null}
        </View>

        <View style={styles.ladoDireito}>
          {selecionado ? (
            <Selo tipo="sucesso">⇄ Trocar</Selo>
          ) : mostrarVinculo && vinculo ? (
            <Selo tipo={vinculo.value}>{vinculo.label}</Selo>
          ) : null}
          {onEdit ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar jogador ${jogador.nome}`}
              onPress={onEdit}
              hitSlop={10}
              style={({ pressed }) => [
                styles.botaoEditar,
                pressed ? styles.botaoEditarPressionado : null,
              ]}
            >
              <Ionicons
                name="pencil-outline"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {(onPresencaChange && presente !== undefined) ||
      (onPagamentoChange && pago !== undefined) ? (
        <>
          <View style={styles.separadorAcoes} />
          <View style={styles.acoes}>
            {onPresencaChange && presente !== undefined ? (
              <CheckboxComRotulo
                rotulo="Presente"
                marcado={presente}
                accessibilityLabel={`Presença de ${jogador.nome}`}
                onChange={onPresencaChange}
              />
            ) : null}
            {onPagamentoChange && pago !== undefined ? (
              <CheckboxComRotulo
                rotulo={jogador.vinculo === "avulso" ? "Pago" : "Mensalidade"}
                marcado={pago}
                desabilitado={desabilitarPagamento}
                accessibilityLabel={`${
                  jogador.vinculo === "avulso"
                    ? "Pagamento do jogo de"
                    : "Mensalidade de"
                } ${jogador.nome}`}
                onChange={onPagamentoChange}
              />
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Jogador ${jogador.nome}. Toque para selecionar ou trocar.`}
        onPress={onPress}
      >
        {conteudoCard}
      </Pressable>
    );
  }

  return conteudoCard;
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  itemSelecionado: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cabecalho: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 44,
  },
  conteudo: {
    flex: 1,
    gap: 2,
    justifyContent: "center",
  },
  nome: {
    fontWeight: typography.weights.bold,
  },
  ladoDireito: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  botaoEditar: {
    alignItems: "center",
    backgroundColor: colors.neutralBackground,
    borderRadius: radii.pill,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  botaoEditarPressionado: {
    opacity: 0.6,
  },
  separadorAcoes: {
    backgroundColor: colors.border,
    height: 1,
    marginHorizontal: -spacing.lg,
    marginTop: spacing.xs,
  },
  acoes: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xl,
    paddingTop: spacing.xs,
  },
  ficticio: {
    fontStyle: "italic",
  },
});

