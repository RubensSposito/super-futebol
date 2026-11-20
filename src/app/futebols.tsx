import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Botao, Texto } from "@/components/atoms";
import { TelaBase } from "@/components/templates";
import { abrirFutebol, excluirFutebol, listarFutebols, setFutebolAtivoId } from "@/db";
import { DIAS_SEMANA } from "@/constants";
import { limparStoresFutebol, useDadosPersistidosStore, usePartidaRapidaStore, useSorteioStore } from "@/store";
import { colors, radii, spacing } from "@/theme";
import type { FutebolLista } from "@/types";

export default function Futebols() {
  const router = useRouter();
  const params = useLocalSearchParams<{ saiu?: string }>();
  const [itens, setItens] = useState<FutebolLista[]>([]);
  const [selecionado, setSelecionado] = useState<FutebolLista | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const definirAtivo = useDadosPersistidosStore((state) => state.definirFutebolAtivo);
  const carregarLista = useCallback(async () => {
    const resultado = await listarFutebols();
    if (resultado.sucesso) setItens(resultado.dados);
    else setErro(resultado.mensagem);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Loads persisted data into the screen after mount.
  useEffect(() => { void carregarLista(); }, [carregarLista]);

  async function abrir(item: FutebolLista) {
    const resultado = await abrirFutebol(item.id);
    if (!resultado.sucesso) { setErro(resultado.mensagem); return; }
    limparStoresFutebol();
    definirAtivo(item.id);
    router.dismissAll();
    router.replace("/home");
  }

  function confirmarExclusao(item: FutebolLista) {
    Alert.alert("Excluir futebol?", `O futebol “${item.nome}” e seus ${item.quantidadeJogadoresCadastrados} jogadores serão apagados. Essa ação não pode ser desfeita.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir futebol", style: "destructive", onPress: () => { void (async () => { const r = await excluirFutebol(item.id); if (!r.sucesso) { setErro(r.mensagem); return; } if (r.dados.eraAtivo) limparStoresFutebol(); setSelecionado(null); await carregarLista(); })(); } },
    ]);
  }
  function novo() {
    limparStoresFutebol();
    void (async () => {
      await setFutebolAtivoId(null);
      router.dismissAll();
      router.replace("/onboarding");
    })();
  }
  function sorteioRapido() { usePartidaRapidaStore.getState().limpar(); useSorteioStore.getState().limpar(); router.push("/partida-rapida"); }
  function agenda(item: FutebolLista) {
    if (!item.diasSemana.length) return "";
    const dias = item.diasSemana.map((dia) => DIAS_SEMANA.find((d) => d.value === dia)?.label ?? "").join(" e ");
    return `${dias}${item.horario ? ` · ${item.horario}` : ""}`;
  }
  return <>
    <Stack.Screen options={{ title: "Seus futebols", headerShown: true, gestureEnabled: false }} />
    <TelaBase contentStyle={styles.page}>
      {params.saiu ? <Texto variante="corpo" cor="primary">Você saiu de {params.saiu}</Texto> : null}
      {erro ? <Texto variante="legenda" cor="error">{erro}</Texto> : null}
      {itens.length === 0 ? <View style={styles.vazio}><Texto variante="titulo">Nenhum futebol salvo</Texto><Texto variante="corpo">Crie um futebol para começar a organizar seu grupo.</Texto><Botao variante="primario" accessibilityLabel="Criar novo futebol" onPress={novo}>＋ Novo futebol</Botao></View> : <FlatList data={itens} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.lista} renderItem={({ item }) => <View style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${item.nome}`} onPress={() => void abrir(item)} style={styles.cardConteudo}>
          <Texto variante="secao">{item.nome}</Texto><Texto variante="legenda">{item.tipoCadastro === "mensalistas_e_avulsos" ? "Mensalistas e avulsos" : item.tipoCadastro === "so_mensalistas" ? "Só mensalistas" : "Básico"}</Texto><Texto variante="legenda">{item.quantidadeJogadoresCadastrados} jogadores{agenda(item) ? ` · ${agenda(item)}` : ""}</Texto>
        </Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Opções de ${item.nome}`} onPress={() => setSelecionado(item)} style={styles.opcoes}><Texto variante="secao">⋯</Texto></Pressable>
      </View>} />}
      <View style={styles.rodape}><Botao variante="primario" accessibilityLabel="Criar novo futebol" onPress={novo}>＋ Novo futebol</Botao><Botao variante="secundario" accessibilityLabel="Sorteio rápido só para hoje" onPress={sorteioRapido}>Sorteio rápido (só hoje)</Botao></View>
    </TelaBase>
    <Modal transparent animationType="slide" visible={selecionado !== null} onRequestClose={() => setSelecionado(null)}>
      <View style={styles.scrim}><Pressable accessibilityRole="button" accessibilityLabel="Fechar opções" style={styles.backdrop} onPress={() => setSelecionado(null)} /><View style={styles.sheet}>
        <Texto variante="secao">{selecionado?.nome}</Texto>
        {selecionado ? <Botao variante="primario" accessibilityLabel={`Abrir ${selecionado.nome}`} onPress={() => void abrir(selecionado)}>Abrir</Botao> : null}
        {selecionado ? <Pressable accessibilityRole="button" accessibilityLabel={`Excluir ${selecionado.nome}`} onPress={() => confirmarExclusao(selecionado)} style={styles.excluir}><Texto variante="corpo" style={styles.textoExcluir}>Excluir futebol</Texto></Pressable> : null}
        <Botao variante="secundario" accessibilityLabel="Cancelar opções" onPress={() => setSelecionado(null)}>Cancelar</Botao>
      </View></View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({ page: { flex: 1, padding: spacing.md, paddingBottom: spacing.sm, gap: spacing.md }, lista: { gap: spacing.md, paddingBottom: spacing.md }, card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.card, flexDirection: "row", alignItems: "center", padding: spacing.md, gap: spacing.sm }, cardConteudo: { flex: 1, minHeight: 64, justifyContent: "center", gap: spacing.xs }, opcoes: { minWidth: 48, minHeight: 48, justifyContent: "center", alignItems: "center" }, rodape: { gap: spacing.sm }, vazio: { flex: 1, justifyContent: "center", gap: spacing.md }, scrim: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay }, backdrop: { ...StyleSheet.absoluteFill }, excluir: { minHeight: 48, justifyContent: "center", alignItems: "center", borderRadius: radii.button, backgroundColor: colors.errorBackground }, textoExcluir: { color: colors.error, fontWeight: "700" }, sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, padding: spacing.screen, gap: spacing.md } });
