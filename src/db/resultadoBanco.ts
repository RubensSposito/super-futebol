import type { ResultadoBanco } from "@/types";

export async function executarComResultado<T>(
  operacao: string,
  mensagemFalha: string,
  executar: () => Promise<T>,
): Promise<ResultadoBanco<T>> {
  try {
    return { sucesso: true, dados: await executar() };
  } catch (erro: unknown) {
    console.warn(`${operacao}: falha na operação SQLite`, erro);
    return { sucesso: false, mensagem: mensagemFalha };
  }
}
