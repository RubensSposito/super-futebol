import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import type { Jogador, ResultadoDivisaoTimes, TimeFormado } from "@/types";
import { SeletorTamanhoDoTime } from "./SeletorTamanhoDoTime";
import { Botao, Texto } from "@/components/atoms";
import { LinhaDeAlternador } from "@/components/molecules";
import { CartaoTime } from "./CartaoTime";
import { ResumoPartida } from "./ResumoPartida";
import { SecaoReservas } from "./SecaoReservas";
import { borders, colors, radii, spacing } from "@/theme";

type ResultadoPartidaProps = {
  resultado: ResultadoDivisaoTimes;
  modoAutomatico: boolean;
  tamanhoEmUso: number;
  tamanhoDigitado: string;
  erroTamanho: string | null;
  onTamanhoChange: (valor: string) => void;
  onModoAutomaticoChange: (valor: boolean) => void;
  onSortearNovamente: () => void;
  rotulo: string;
  onVoltar: () => void;
  textoTimes: string;
  timesEmUso: number;
  onTextoTimesChange: (valor: string) => void;
  erroTimes: string | null;
  onLimparTamanho: () => void;
  onLimparTimes: () => void;
  temNivel: boolean;
  equilibrarPorNivel: boolean;
  onEquilibrarPorNivelChange: (valor: boolean) => void;
  jogadorSelecionadoId?: string | null;
  onSelecionarJogador?: (jogador: Jogador) => void;
  onCancelarTroca?: () => void;
  onSalvarTimes?: () => void;
  salvandoTimes?: boolean;
  podeSalvar?: boolean;
  onCompartilhar?: () => void;
  onAbrirImportar?: () => void;
  mensagemSucesso?: string | null;
};

export function ResultadoPartida({
  resultado,
  modoAutomatico,
  tamanhoEmUso,
  tamanhoDigitado,
  erroTamanho,
  onTamanhoChange,
  onModoAutomaticoChange,
  onSortearNovamente,
  rotulo,
  onVoltar,
  textoTimes,
  timesEmUso,
  onTextoTimesChange,
  erroTimes,
  onLimparTamanho,
  onLimparTimes,
  temNivel,
  equilibrarPorNivel,
  onEquilibrarPorNivelChange,
  jogadorSelecionadoId,
  onSelecionarJogador,
  onCancelarTroca,
  onSalvarTimes,
  salvandoTimes = false,
  podeSalvar = false,
  onCompartilhar,
  onAbrirImportar,
  mensagemSucesso,
}: ResultadoPartidaProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList<TimeFormado>
        style={styles.lista}
        contentContainerStyle={styles.conteudoLista}
        data={resultado.times}
        keyExtractor={(time) => String(time.numero)}
        renderItem={({ item }) => (
          <CartaoTime
            time={item}
            jogadorSelecionadoId={jogadorSelecionadoId}
            onSelecionarJogador={onSelecionarJogador}
          />
        )}
        ListHeaderComponent={
          <View style={styles.cabecalho}>
            <View style={styles.acoesTopo}>
              {onCompartilhar ? (
                <Botao
                  variante="primario"
                  accessibilityLabel="Compartilhar escalação no WhatsApp"
                  onPress={onCompartilhar}
                  style={styles.botaoTopo}
                >
                  📤 Compartilhar times
                </Botao>
              ) : null}
              {onAbrirImportar ? (
                <Botao
                  variante="secundario"
                  accessibilityLabel="Importar times prontos"
                  onPress={onAbrirImportar}
                  style={styles.botaoTopo}
                >
                  📥 Importar times prontos
                </Botao>
              ) : null}
            </View>

            {mensagemSucesso ? (
              <View style={styles.avisoSucesso}>
                <Texto variante="corpo" cor="primary" style={styles.textoSucesso}>
                  {mensagemSucesso}
                </Texto>
              </View>
            ) : null}

            {jogadorSelecionadoId ? (
              <View style={styles.bannerTroca}>
                <Texto variante="corpo" cor="primary" style={styles.textoTroca}>
                  ⇄ Jogador selecionado. Toque em outro jogador de qualquer time ou reserva para trocá-los de lugar.
                </Texto>
                {onCancelarTroca ? (
                  <Pressable onPress={onCancelarTroca} hitSlop={10} style={styles.botaoCancelarTroca}>
                    <Texto variante="legenda" cor="textSecondary">Cancelar troca</Texto>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <SeletorTamanhoDoTime
              modoAutomatico={modoAutomatico}
              tamanhoEmUso={tamanhoEmUso}
              textoCampo={tamanhoDigitado}
              erro={erroTamanho}
              totalJogadores={resultado.totais.jogadores}
              onModoAutomaticoChange={onModoAutomaticoChange}
              onTextoCampoChange={onTamanhoChange}
              textoTimes={textoTimes}
              timesEmUso={timesEmUso}
              onTextoTimesChange={onTextoTimesChange}
              erroTimes={erroTimes}
              onLimparTamanho={onLimparTamanho}
              onLimparTimes={onLimparTimes}
            />
            {temNivel ? (
              <LinhaDeAlternador
                titulo="Equilibrar por nível"
                apoio="Evita juntar os jogadores mais fortes no mesmo time."
                valor={equilibrarPorNivel}
                onChange={onEquilibrarPorNivelChange}
              />
            ) : null}
            {rotulo ? <Texto variante="legenda">Sorteio iniciado em: {rotulo}</Texto> : null}
            <ResumoPartida resultado={resultado} />
          </View>
        }
        ListFooterComponent={
          <SecaoReservas
            reservas={resultado.reservas}
            mostrarNotaGoleiroExtra={resultado.times.some(
              (time) => time.vagaExtraGoleiro,
            )}
            jogadorSelecionadoId={jogadorSelecionadoId}
            onSelecionarJogador={onSelecionarJogador}
          />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
      <View style={styles.rodape}>
        {podeSalvar && onSalvarTimes ? (
          <Botao
            variante="primario"
            accessibilityLabel="Salvar times do dia"
            desabilitado={salvandoTimes}
            onPress={onSalvarTimes}
          >
            {salvandoTimes ? "Salvando times..." : "💾 Salvar times do jogo"}
          </Botao>
        ) : null}
        <Botao
          variante="secundario"
          accessibilityLabel="Sortear novamente"
          onPress={onSortearNovamente}
        >
          🎲 Sortear novamente
        </Botao>
        <Botao variante="secundario" accessibilityLabel="Voltar" onPress={onVoltar}>
          Voltar
        </Botao>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  acoesTopo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  botaoTopo: {
    flexBasis: "48%",
    flexGrow: 1,
  },
  avisoSucesso: {
    backgroundColor: colors.successBackground,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  textoSucesso: {
    fontWeight: "bold",
    textAlign: "center",
  },
  bannerTroca: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  textoTroca: {
    fontWeight: "600",
  },
  botaoCancelarTroca: {
    alignSelf: "flex-end",
    paddingVertical: spacing.xs,
  },
  rodape: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: borders.separator,
    gap: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  lista: {
    flex: 1,
  },
  conteudoLista: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  cabecalho: {
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
});

