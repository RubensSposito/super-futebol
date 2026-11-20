import { useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { Botao, Texto } from "@/components/atoms";
import { DIAS_SEMANA, FREQUENCIAS } from "@/constants";
import { obterDataLocal } from "@/lib/datas";
import type { AgendaFutebol } from "@/types";
import { colors, dimensions, radii, spacing } from "@/theme";

type SeletorAberto = "horario" | "vencimento" | null;

type JanelaQuadraEAgendaProps = {
  agenda: AgendaFutebol;
  vencimentoObrigatorio: boolean;
  onSalvar: (agenda: AgendaFutebol) => void;
  onCancelar: () => void;
};

function dataPickerLocal(dataIso: string): Date {
  const [ano, mes, dia] = (dataIso || obterDataLocal()).split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function dataCompleta(iso: string): string {
  if (!iso) return "Selecionar data";
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

function horarioDate(horario: string | null): Date {
  const [hora, minuto] = (horario ?? "20:00").split(":").map(Number);
  return new Date(2020, 0, 1, hora, minuto, 0, 0);
}

function horarioTexto(data: Date): string {
  return `${data.getHours().toString().padStart(2, "0")}:${data.getMinutes().toString().padStart(2, "0")}`;
}

export function JanelaQuadraEAgenda({
  agenda,
  vencimentoObrigatorio,
  onSalvar,
  onCancelar,
}: JanelaQuadraEAgendaProps) {
  const [rascunho, setRascunho] = useState<AgendaFutebol>({
    ...agenda,
    diasSemana: [...agenda.diasSemana],
  });
  const [seletorAberto, setSeletorAberto] = useState<SeletorAberto>(null);
  const [dataHorario, setDataHorario] = useState(() => horarioDate(agenda.horario));
  const [erroVencimentoVisivel, setErroVencimentoVisivel] = useState(false);

  function fechar() {
    Keyboard.dismiss();
    onCancelar();
  }

  function atualizarAgenda(atualizar: Partial<AgendaFutebol>) {
    setRascunho((atual) => ({ ...atual, ...atualizar }));
  }

  function alterarHorario(
    _event: DateTimePickerChangeEvent,
    value?: Date,
  ) {
    if (!value) {
      setSeletorAberto(null);
      return;
    }
    setDataHorario(value);
    atualizarAgenda({ horario: horarioTexto(value) });
    if (Platform.OS === "android") setSeletorAberto(null);
  }

  function alterarVencimento(
    _event: DateTimePickerChangeEvent,
    value?: Date,
  ) {
    if (!value) {
      setSeletorAberto(null);
      return;
    }
    atualizarAgenda({ vencimentoQuadra: obterDataLocal(value) });
    setErroVencimentoVisivel(false);
    if (Platform.OS === "android") setSeletorAberto(null);
  }

  function salvar() {
    if (vencimentoObrigatorio && !rascunho.vencimentoQuadra) {
      setErroVencimentoVisivel(true);
      return;
    }
    onSalvar(rascunho);
    fechar();
  }

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={fechar}
    >
      <View style={styles.modal}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar quadra e agenda sem salvar"
          onPress={fechar}
          style={styles.fundo}
        />
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.conteudo}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.handle} />
            <Texto variante="secao">Quadra e agenda</Texto>
            <View style={styles.grupo}>
              <Texto variante="legenda">Dias de jogo (opcional)</Texto>
              <View style={styles.chips}>
                {DIAS_SEMANA.map((dia) => (
                  <Botao
                    key={dia.value}
                    variante="opcao"
                    ativo={rascunho.diasSemana.includes(dia.value)}
                    accessibilityLabel={`Dia de jogo: ${dia.nome}`}
                    onPress={() =>
                      atualizarAgenda({
                        diasSemana: rascunho.diasSemana.includes(dia.value)
                          ? rascunho.diasSemana.filter((valor) => valor !== dia.value)
                          : [...rascunho.diasSemana, dia.value].sort((a, b) => a - b),
                      })
                    }
                    style={styles.chip}
                  >
                    {dia.label}
                  </Botao>
                ))}
              </View>
            </View>
            <View style={styles.grupo}>
              <Texto variante="legenda">Frequência (opcional)</Texto>
              <View style={styles.chips}>
                {FREQUENCIAS.map((item) => (
                  <Botao
                    key={item.value}
                    variante="opcao"
                    ativo={rascunho.frequencia === item.value}
                    accessibilityLabel={`Frequência de jogo: ${item.label}`}
                    onPress={() =>
                      atualizarAgenda({
                        frequencia:
                          rascunho.frequencia === item.value ? null : item.value,
                      })
                    }
                    style={styles.chip}
                  >
                    {item.label}
                  </Botao>
                ))}
              </View>
            </View>
            <View style={styles.grupo}>
              <Texto variante="legenda">Horário (opcional)</Texto>
              <View style={styles.linhaAcoes}>
                <Botao
                  variante="secundario"
                  accessibilityLabel={
                    rascunho.horario
                      ? `Editar horário ${rascunho.horario}`
                      : "Definir horário do jogo"
                  }
                  onPress={() => setSeletorAberto("horario")}
                  style={styles.botaoHorario}
                >
                  {rascunho.horario ?? "Selecionar horário"}
                </Botao>
                <Botao
                  variante="secundario"
                  accessibilityLabel="Limpar horário do jogo"
                  desabilitado={rascunho.horario === null}
                  onPress={() => atualizarAgenda({ horario: null })}
                  style={styles.botaoLimpar}
                >
                  Limpar
                </Botao>
              </View>
              {seletorAberto === "horario" ? (
                <DateTimePicker
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "clock"}
                  is24Hour
                  locale="pt-BR"
                  value={dataHorario}
                  onValueChange={alterarHorario}
                  onDismiss={() => setSeletorAberto(null)}
                />
              ) : null}
            </View>
            <View style={styles.grupo}>
              <Texto variante="legenda">
                Vencimento da quadra{vencimentoObrigatorio ? " · obrigatório" : " (opcional)"}
              </Texto>
              <View style={styles.linhaAcoes}>
                <Botao
                  variante="secundario"
                  accessibilityLabel={
                    rascunho.vencimentoQuadra
                      ? `Editar vencimento da quadra em ${dataCompleta(rascunho.vencimentoQuadra)}`
                      : "Definir vencimento da quadra"
                  }
                  onPress={() => setSeletorAberto("vencimento")}
                  style={styles.botaoHorario}
                >
                  {dataCompleta(rascunho.vencimentoQuadra)}
                </Botao>
                {!vencimentoObrigatorio ? (
                  <Botao
                    variante="secundario"
                    accessibilityLabel="Limpar vencimento da quadra"
                    desabilitado={!rascunho.vencimentoQuadra}
                    onPress={() => {
                      atualizarAgenda({ vencimentoQuadra: "" });
                      setErroVencimentoVisivel(false);
                    }}
                    style={styles.botaoLimpar}
                  >
                    Limpar
                  </Botao>
                ) : null}
              </View>
              <Texto variante="legenda">
                Repete todo mês nesse dia (nos meses mais curtos, vale o último dia).
              </Texto>
              {seletorAberto === "vencimento" ? (
                <DateTimePicker
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  locale="pt-BR"
                  value={dataPickerLocal(rascunho.vencimentoQuadra)}
                  onValueChange={alterarVencimento}
                  onDismiss={() => setSeletorAberto(null)}
                />
              ) : null}
              {erroVencimentoVisivel && vencimentoObrigatorio && !rascunho.vencimentoQuadra ? (
                <Texto variante="legenda" cor="error" accessibilityLiveRegion="polite">
                  Defina o vencimento da quadra
                </Texto>
              ) : null}
            </View>
            <View style={styles.botoes}>
              <Botao
                variante="primario"
                accessibilityLabel="Salvar quadra e agenda"
                onPress={salvar}
              >
                Salvar
              </Botao>
              <Botao
                variante="secundario"
                accessibilityLabel="Cancelar alterações de quadra e agenda"
                onPress={fechar}
              >
                Cancelar
              </Botao>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: "flex-end" },
  fundo: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    maxHeight: "90%",
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  conteudo: { gap: spacing.lg },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: dimensions.sheetHandleHeight,
    marginBottom: spacing.sm,
    width: dimensions.sheetHandleWidth,
  },
  grupo: { gap: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { flexBasis: "22%", flexGrow: 1 },
  linhaAcoes: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  botaoHorario: { flexGrow: 1, flexBasis: "60%" },
  botaoLimpar: { flexGrow: 1, flexBasis: "30%" },
  botoes: { gap: spacing.sm, paddingTop: spacing.sm },
});
