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
import type { Nivel, Posicao, TipoJogador, Vinculo } from "@/types";
import { NIVEIS, POSICOES, TIPOS_JOGADOR, VINCULOS } from "@/constants";
import { Botao, Texto } from "@/components/atoms";
import {
  CampoComRotulo,
  SeletorDeOpcoes,
} from "@/components/molecules";
import { colors, dimensions, radii, spacing } from "@/theme";

type FormularioJogadorSheetProps = {
  visivel: boolean;
  nome: string;
  tipo: TipoJogador;
  posicao: Posicao | null;
  nivel: Nivel | null;
  mostrarVinculo?: boolean;
  vinculo?: Vinculo;
  modo?: "criacao" | "edicao";
  erroNome: string | null;
  erroTipo?: string | null;
  erroVinculo?: string | null;
  erroFormulario?: string | null;
  onNomeChange: (nome: string) => void;
  onTipoChange: (tipo: TipoJogador) => void;
  onPosicaoChange: (posicao: Posicao | null) => void;
  onNivelChange: (nivel: Nivel | null) => void;
  onVinculoChange?: (vinculo: Vinculo) => void;
  onSalvar: () => void;
  onCancelar: () => void;
};

export function FormularioJogadorSheet({
  visivel,
  nome,
  tipo,
  posicao,
  nivel,
  mostrarVinculo = false,
  vinculo = "mensalista",
  modo = "criacao",
  erroNome,
  erroTipo = null,
  erroVinculo = null,
  erroFormulario = null,
  onNomeChange,
  onTipoChange,
  onPosicaoChange,
  onNivelChange,
  onVinculoChange,
  onSalvar,
  onCancelar,
}: FormularioJogadorSheetProps) {
  function fechar() {
    Keyboard.dismiss();
    onCancelar();
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
          accessibilityLabel="Fechar formulário"
          onPress={fechar}
          style={styles.fundo}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.teclado}
        >
          <View style={styles.sheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.conteudo}
            >
              <View style={styles.handle} />
              <Texto variante="secao">
                {modo === "edicao" ? "Editar jogador" : "Adicionar jogador"}
              </Texto>
              <View style={styles.campos}>
                <CampoComRotulo
                  rotulo="Nome"
                  accessibilityLabel="Nome do jogador"
                  valor={nome}
                  placeholder="Nome do jogador"
                  mensagemErro={erroNome}
                  onChangeText={onNomeChange}
                />
                <View style={styles.grupo}>
                  <SeletorDeOpcoes
                    rotulo="Tipo"
                    opcoes={TIPOS_JOGADOR}
                    valor={tipo}
                    onChange={(valor) => {
                      if (valor) onTipoChange(valor);
                    }}
                  />
                  {erroTipo ? (
                    <Texto variante="legenda" cor="error">
                      {erroTipo}
                    </Texto>
                  ) : null}
                </View>
                {tipo === "linha" ? (
                  <SeletorDeOpcoes
                    rotulo="Posição (opcional)"
                    opcoes={POSICOES}
                    valor={posicao}
                    permiteDesmarcar
                    onChange={onPosicaoChange}
                  />
                ) : null}
                <SeletorDeOpcoes
                  rotulo="Nível (opcional)"
                  opcoes={NIVEIS}
                  valor={nivel}
                  permiteDesmarcar
                  onChange={onNivelChange}
                />
                {mostrarVinculo && onVinculoChange ? (
                  <View style={styles.grupo}>
                    <SeletorDeOpcoes
                      rotulo="Vínculo"
                      opcoes={VINCULOS}
                      valor={vinculo}
                      onChange={(valor) => {
                        if (valor) onVinculoChange(valor);
                      }}
                    />
                    {erroVinculo ? (
                      <Texto variante="legenda" cor="error">
                        {erroVinculo}
                      </Texto>
                    ) : null}
                  </View>
                ) : null}
              </View>
              {erroFormulario ? (
                <Texto variante="legenda" cor="error">
                  {erroFormulario}
                </Texto>
              ) : null}
              <View style={styles.botoes}>
                <Botao
                  variante="primario"
                  accessibilityLabel={
                    modo === "edicao"
                      ? "Salvar alterações do jogador"
                      : "Salvar jogador"
                  }
                  onPress={onSalvar}
                >
                  {modo === "edicao" ? "Salvar alterações" : "Salvar"}
                </Botao>
                <Botao
                  variante="secundario"
                  accessibilityLabel="Cancelar cadastro de jogador"
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
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: dimensions.sheetHandleHeight,
    marginBottom: spacing.sm,
    width: dimensions.sheetHandleWidth,
  },
  campos: {
    gap: spacing.lg,
  },
  grupo: {
    gap: spacing.sm,
  },
  botoes: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
