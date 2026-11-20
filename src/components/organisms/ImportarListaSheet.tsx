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
import { TEMPLATE_IMPORTACAO } from "@/constants";
import { Botao, CampoTexto, Texto } from "@/components/atoms";
import { colors, dimensions, radii, spacing, typography } from "@/theme";
import type { ResultadoColarLista, TipoCadastro, Vinculo } from "@/types";
import { VINCULOS } from "@/constants";
import { SeletorDeOpcoes } from "@/components/molecules";

type ImportarListaSheetProps = {
  visivel: boolean;
  onCancelar: () => void;
  tipoCadastro?: TipoCadastro;
  onImportar: (
    texto: string,
    vinculo?: Vinculo,
  ) => boolean | Promise<boolean>;
  onColar: () => Promise<ResultadoColarLista>;
};

const ERRO_LISTA_INVALIDA =
  "Nenhum jogador identificado. Cole uma lista com nomes (ex: 1. João ou - João).";

export function ImportarListaSheet({
  visivel,
  onCancelar,
  tipoCadastro,
  onImportar,
  onColar,
}: ImportarListaSheetProps) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [vinculoLista, setVinculoLista] = useState<Vinculo>("mensalista");
  const mostrarSeletorTipo = tipoCadastro === "mensalistas_e_avulsos";

  function fechar() {
    Keyboard.dismiss();
    setTexto("");
    setErro(null);
    setVinculoLista("mensalista");
    onCancelar();
  }

  async function colarDaAreaDeTransferencia() {
    const resultado = await onColar();
    if (!resultado.sucesso) {
      setErro(
        resultado.motivo === "vazia"
          ? "A área de transferência está vazia."
          : "Não foi possível acessar a área de transferência.",
      );
      return;
    }
    setTexto(resultado.texto);
    setErro(null);
  }

  async function importar() {
    if (!texto.trim()) {
      setErro("Cole ou digite a lista de jogadores antes de importar.");
      return;
    }
    const sucesso = await onImportar(texto, mostrarSeletorTipo ? vinculoLista : undefined);
    if (!sucesso) {
      setErro(ERRO_LISTA_INVALIDA);
      return;
    }
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
          accessibilityLabel="Fechar importação"
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
              keyboardDismissMode="none"
              contentContainerStyle={styles.conteudo}
            >
              <View style={styles.handle} />
              <Texto variante="secao">Importar lista</Texto>
              <Texto variante="corpo">
                Cole sua lista do WhatsApp. Aceita listas numeradas (1. Nome), com traço (- Nome) ou apenas um nome por linha. Para goleiros, você pode usar (G) ou cabeçalho Goleiros:.
              </Texto>
              {mostrarSeletorTipo ? (
                <SeletorDeOpcoes
                  rotulo="Esta lista é de:"
                  opcoes={VINCULOS}
                  valor={vinculoLista}
                  onChange={(valor) => {
                    if (valor) setVinculoLista(valor);
                  }}
                />
              ) : null}
              <CampoTexto
                accessibilityLabel="Lista de jogadores para importar"
                accessibilityHint="Cole ou digite os jogadores, um nome por linha."
                multiline
                scrollEnabled={false}
                blurOnSubmit={false}
                value={texto}
                onChangeText={(valor) => {
                  setTexto(valor);
                  setErro(null);
                }}
                placeholder={TEMPLATE_IMPORTACAO}
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
                  accessibilityLabel="Importar jogadores da lista"
                  onPress={importar}
                >
                  Importar
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
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
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
