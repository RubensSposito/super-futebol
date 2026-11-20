import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Botao, Texto } from "@/components/atoms";
import { DIAS_SEMANA, FREQUENCIAS } from "@/constants";
import type { AgendaFutebol } from "@/types";
import { borders, colors, radii, spacing } from "@/theme";
import { JanelaQuadraEAgenda } from "./JanelaQuadraEAgenda";

type CartaoQuadraEAgendaProps = {
  agenda: AgendaFutebol;
  temDadosQuadra?: boolean;
  vencimentoObrigatorio: boolean;
  erroVencimento?: string | null;
  onSalvar: (agenda: AgendaFutebol) => void;
};

function formatarResumoJogos(agenda: AgendaFutebol): string {
  const dias = agenda.diasSemana
    .map((dia) => DIAS_SEMANA.find((item) => item.value === dia)?.label)
    .filter((dia) => dia !== undefined)
    .join(" e ");
  const frequencia = FREQUENCIAS.find(
    (item) => item.value === agenda.frequencia,
  )?.label;
  return [dias || null, frequencia ?? null, agenda.horario]
    .filter((item): item is string => item !== null)
    .join(" · ");
}

export function CartaoQuadraEAgenda({
  agenda,
  temDadosQuadra = false,
  vencimentoObrigatorio,
  erroVencimento,
  onSalvar,
}: CartaoQuadraEAgendaProps) {
  const [visivel, setVisivel] = useState(false);
  const resumoJogos = formatarResumoJogos(agenda);
  const temDados = Boolean(
    temDadosQuadra || agenda.diasSemana.length || agenda.frequencia || agenda.horario || agenda.vencimentoQuadra,
  );

  return (
    <View
      style={[
        styles.cartao,
        erroVencimento ? styles.cartaoComErro : null,
      ]}
    >
      <Texto variante="corpo">
        {`Jogos: ${resumoJogos || "não definido"}`}
      </Texto>
      <Texto variante="corpo">
        {agenda.vencimentoQuadra
          ? `Vencimento da quadra: todo dia ${agenda.vencimentoQuadra.slice(8, 10)}${vencimentoObrigatorio ? " (obrigatório)" : ""}`
          : `Vencimento da quadra: não definido${vencimentoObrigatorio ? " (obrigatório)" : ""}`}
      </Texto>
      {erroVencimento ? (
        <Texto variante="legenda" cor="error" accessibilityLiveRegion="polite">
          {erroVencimento}
        </Texto>
      ) : null}
      <Botao
        variante="secundario"
        accessibilityLabel={temDados ? "Editar quadra e agenda" : "Definir quadra e agenda"}
        onPress={() => setVisivel(true)}
      >
        {temDados ? "Editar" : "Definir"}
      </Botao>
      {visivel ? (
        <JanelaQuadraEAgenda
          key={`${agenda.vencimentoQuadra}:${agenda.horario ?? ""}:${agenda.diasSemana.join(",")}:${agenda.frequencia ?? ""}`}
          agenda={agenda}
          vencimentoObrigatorio={vencimentoObrigatorio}
          onSalvar={onSalvar}
          onCancelar={() => setVisivel(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    gap: spacing.md,
    padding: spacing.lg,
  },
  cartaoComErro: {
    borderColor: colors.error,
    borderWidth: borders.highlight,
  },
});
