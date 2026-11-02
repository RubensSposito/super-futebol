export { getConfig, getDb, isSetupDone, setConfig } from "./conexao";
export { carregarDadosHome } from "./homeRepository";
export {
  atualizarFutebol,
  obterFutebol,
  salvarFutebol,
} from "./futebolRepository";
export {
  adicionarJogadorBanco,
  adicionarJogadoresBanco,
  atualizarJogadorBanco,
  listarJogadores,
} from "./jogadoresRepository";
export { definirPresenca, obterPresencas } from "./presencasRepository";
export { concluirCadastroCompleto, resetarDados } from "./setupRepository";
export type {
  DadosHome,
  Futebol,
  Jogador,
  NovoJogador,
  ResultadoAdicionarLista,
  ResultadoAdicaoJogadorBanco,
  ResultadoBanco,
} from "@/types";
