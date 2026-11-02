import { useEffect, useState } from "react";
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
import type { FrequenciaFutebol } from "@/types";
import { colors, dimensions, radii, spacing } from "@/theme";

type AgendaFutebolSheetProps = {
  visivel: boolean;
  diasSemana: number[];
  frequencia: FrequenciaFutebol | null;
  horario: string | null;
  onSalvar: (
    diasSemana: number[],
    frequencia: FrequenciaFutebol | null,
    horario: string | null,
  ) => void;
  onCancelar: () => void;
};

function dataDoHorario(horario: string | null): Date {
  const data = new Date();
  const [hora, minuto] = (horario ?? "20:00").split(":").map(Number);
  data.setHours(hora, minuto, 0, 0);
  return data;
}

function formatarHorario(data: Date): string {
  const hora = data.getHours().toString().padStart(2, "0");
  const minuto = data.getMinutes().toString().padStart(2, "0");
  return `${hora}:${minuto}`;
}

export function AgendaFutebolSheet({
  visivel,
  diasSemana,
  frequencia,
  horario,
  onSalvar,
  onCancelar,
}: AgendaFutebolSheetProps) {
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>(diasSemana);
  const [frequenciaSelecionada, setFrequenciaSelecionada] =
    useState<FrequenciaFutebol | null>(frequencia);
  const [horarioSelecionado, setHorarioSelecionado] = useState(horario);
  const [dataHorario, setDataHorario] = useState(() =>
    dataDoHorario(horario),
  );
  const [pickerVisivel, setPickerVisivel] = useState(false);

  useEffect(() => {
    if (!visivel) return;
    setDiasSelecionados(diasSemana);
    setFrequenciaSelecionada(frequencia);
    setHorarioSelecionado(horario);
    setDataHorario(dataDoHorario(horario));
    setPickerVisivel(false);
  }, [diasSemana, frequencia, horario, visivel]);

  function escolherHorario(
    _event: DateTimePickerChangeEvent,
    value: Date,
  ) {
    if (Platform.OS === "android") setPickerVisivel(false);
    setDataHorario(value);
    setHorarioSelecionado(formatarHorario(value));
  }

  function dispensarSeletorHorario() {
    if (Platform.OS === "android") setPickerVisivel(false);
  }

  function fechar() {
    Keyboard.dismiss();
    onCancelar();
  }

  function limpar() {
    onSalvar([], null, null);
    fechar();
  }

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={fechar}
    >
      <View style={styles.modal}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar dados de agenda"
          onPress={fechar}
          style={styles.fundo}
        />
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.conteudo}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.handle} />
            <Texto variante="secao">Dia, frequência e horário</Texto>
            <View style={styles.grupo}>
              <Texto variante="legenda">Dias da semana (opcional)</Texto>
              <View style={styles.chips}>
                {DIAS_SEMANA.map((dia) => (
                  <Botao
                    key={dia.value}
                    variante="opcao"
                    ativo={diasSelecionados.includes(dia.value)}
                    accessibilityLabel={`Dia da semana: ${dia.nome}`}
                    onPress={() =>
                      setDiasSelecionados((atuais) =>
                        atuais.includes(dia.value)
                          ? atuais.filter((valor) => valor !== dia.value)
                          : [...atuais, dia.value].sort((a, b) => a - b),
                      )
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
                    ativo={frequenciaSelecionada === item.value}
                    accessibilityLabel={`Frequência: ${item.label}`}
                    onPress={() =>
                      setFrequenciaSelecionada((atual) =>
                        atual === item.value ? null : item.value,
                      )
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
              <Botao
                variante="secundario"
                accessibilityLabel={
                  horarioSelecionado
                    ? `Horário ${horarioSelecionado}`
                    : "Escolher horário"
                }
                onPress={() => {
                  setPickerVisivel(true);
                }}
              >
                {horarioSelecionado ?? "Escolher horário"}
              </Botao>
              {Platform.OS === "ios" && pickerVisivel ? (
                <DateTimePicker
                  mode="time"
                  display="spinner"
                  is24Hour
                  locale="pt-BR"
                  value={dataHorario}
                  onValueChange={escolherHorario}
                  onDismiss={dispensarSeletorHorario}
                  onNeutralButtonPress={dispensarSeletorHorario}
                />
              ) : null}
              {Platform.OS === "android" && pickerVisivel ? (
                <DateTimePicker
                  mode="time"
                  display="clock"
                  is24Hour
                  value={dataHorario}
                  onValueChange={escolherHorario}
                  onDismiss={dispensarSeletorHorario}
                  onNeutralButtonPress={dispensarSeletorHorario}
                />
              ) : null}
            </View>
            <View style={styles.botoes}>
              <Botao
                variante="primario"
                accessibilityLabel="Salvar dia, frequência e horário"
                onPress={() => {
                  onSalvar(
                    diasSelecionados,
                    frequenciaSelecionada,
                    horarioSelecionado,
                  );
                  fechar();
                }}
              >
                Salvar
              </Botao>
              <Botao
                variante="secundario"
                accessibilityLabel="Limpar dia, frequência e horário"
                onPress={limpar}
              >
                Limpar
              </Botao>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: "flex-end",
  },
  fundo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    maxHeight: "90%",
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  conteudo: {
    gap: spacing.lg,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: dimensions.sheetHandleHeight,
    marginBottom: spacing.sm,
    width: dimensions.sheetHandleWidth,
  },
  grupo: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    flexGrow: 0,
    minWidth: dimensions.touchTarget,
  },
  botoes: {
    gap: spacing.md,
  },
});
