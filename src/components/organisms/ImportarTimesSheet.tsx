import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Botao, CampoTexto, Texto } from "@/components/atoms";
import { colors, dimensions, radii, spacing, typography } from "@/theme";
import type { Jogador, ResultadoDivisaoTimes } from "@/types";
import { lerTimesSorteados } from "@/lib/importacao";

type ImportarTimesSheetProps = {
  visivel: boolean;
  onCancelar: () => void;
  jogadoresExistentes: readonly Jogador[];
  onImportado: (resultado: ResultadoDivisaoTimes, novosJogadores: Jogador[]) => void;
};

const TEMPLATE_TIMES = `Time 1:
- Carlos (G)
- João
- Lucas
- Bruno

Time 2:
- Marcos (G)
- Rafael
- Diego
- Gabriel`;

export function ImportarTimesSheet({
  visivel,
  onCancelar,
  jogadoresExistentes,
  onImportado,
}: ImportarTimesSheetProps) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    Keyboard.dismiss();
    setTexto("");
    setErro(null);
    onCancelar();
  }

  async function colarDaAreaDeTransferencia() {
    try {
      const conteudo = await Clipboard.getStringAsync();
      if (!conteudo || !conteudo.trim()) {
        setErro("A área de transferência está vazia.");
        return;
      }
      setTexto(conteudo);
      setErro(null);
    } catch {
      setErro("Não foi possível acessar a área de transferência.");
    }
  }

  function importar() {
    if (!texto.trim()) {
      setErro("Cole o texto dos times antes de importar.");
      return;
    }
    const importacao = lerTimesSorteados(texto, jogadoresExistentes);
    if (!importacao.sucesso || !importacao.resultado) {
      setErro(importacao.mensagemErro ?? "Não foi possível identificar os times.");
      return;
    }
    onImportado(importacao.resultado, importacao.jogadoresNovos);
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
          accessibilityLabel="Fechar importação de times"
          onPress={fechar}
          style={styles.fundo}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.teclado}
        >
          <View style={styles.sheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.conteudo}
            >
              <View style={styles.handle} />
              <Texto variante="secao">Importar times sorteados</Texto>
              <Texto variante="corpo">
                Cole a escalação com os times já divididos do WhatsApp (ex: Time 1 e Time 2).
              </Texto>

              <CampoTexto
                accessibilityLabel="Texto dos times para importar"
                accessibilityHint="Cole os times separados por cabeçalhos"
                multiline
                scrollEnabled={false}
                blurOnSubmit={false}
                value={texto}
                onChangeText={(valor) => {
                  setTexto(valor);
                  setErro(null);
                }}
                placeholder={TEMPLATE_TIMES}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="sentences"
                style={styles.campo}
              />

              {erro ? (
                <Texto variante="legenda" cor="error">
                  {erro}
                </Texto>
              ) : null}

              <View style={styles.linhaAcoesTexto}>
                <Botao
                  variante="secundario"
                  accessibilityLabel="Colar da área de transferência"
                  onPress={colarDaAreaDeTransferencia}
                  style={styles.botaoAcaoTexto}
                >
                  Colar do WhatsApp
                </Botao>
                {texto.trim().length > 0 ? (
                  <Botao
                    variante="secundario"
                    accessibilityLabel="Limpar texto"
                    onPress={() => {
                      setTexto("");
                      setErro(null);
                    }}
                    style={styles.botaoLimparTexto}
                  >
                    ✕ Limpar
                  </Botao>
                ) : null}
              </View>

              <View style={styles.botoes}>
                <Botao
                  variante="primario"
                  accessibilityLabel="Carregar times"
                  onPress={importar}
                >
                  Carregar times
                </Botao>
                <Botao
                  variante="secundario"
                  accessibilityLabel="Cancelar importação"
                  onPress={fechar}
                >
                  Cancelar
                </Botao>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  teclado: {
    flex: 1,
    justifyContent: "flex-end",
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
    paddingBottom: spacing.xxxl * 2,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: dimensions.sheetHandleHeight,
    marginBottom: spacing.sm,
    width: dimensions.sheetHandleWidth,
  },
  campo: {
    fontFamily: typography.families.monospace,
    minHeight: dimensions.multilineFieldMinHeight,
  },
  linhaAcoesTexto: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  botaoAcaoTexto: {
    flex: 1,
  },
  botaoLimparTexto: {
    minWidth: 100,
  },
  botoes: {
    gap: spacing.md,
  },
});
