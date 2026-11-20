import { useDadosPersistidosStore } from "./dadosPersistidosStore";
import { usePartidaRapidaStore } from "./partidaRapidaStore";
import { useRascunhoCadastroStore } from "./rascunhoCadastroStore";
import { useSorteioStore } from "./sorteioStore";

export function limparStoresFutebol(): void {
  useDadosPersistidosStore.getState().limpar();
  useRascunhoCadastroStore.getState().limpar();
  usePartidaRapidaStore.getState().limpar();
  useSorteioStore.getState().limpar();
}
